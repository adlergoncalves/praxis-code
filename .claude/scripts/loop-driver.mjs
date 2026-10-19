#!/usr/bin/env node
// loop-driver.mjs — Driver do /execute: UMA fatia por sessao nova do Claude Code, em sequencia.
//
// Por que existe: com o loop inteiro numa sessao so, o contexto cresce a cada fatia (cada chamada
// carrega tudo o que veio antes) e o loop passa boa parte do tempo parado esperando o humano dizer
// "proxima". Sessao nova por fatia corta as duas coisas: cada fatia roda num processo `claude -p`
// proprio, com o contexto vazio; o tasks.md (Loop Log) e o git dao a retomada, e a Regra 0 do
// /execute roda o Preflight em toda sessao.
//
// O driver PARA quando:
//   - nenhuma fatia do Loop Log esta TODO ou WIP;
//   - a sessao terminou sem nenhuma fatia nova em DONE (BLOCKED, watchdog, falha, teto de gasto);
//   - a ultima linha do relatorio e "DRIVER: PARAR - <motivo>" (decisao humana pendente);
//   - a ultima linha nao e "DRIVER: CONTINUAR" (relatorio fora do contrato: ler o log antes);
//   - chegou ao --max da rodada.
// Cada sessao grava o JSON de saida (resultado, custo, duracao) em --log, FORA do repositorio.
//
// Uso:
//   node .claude/scripts/loop-driver.mjs --feature <pasta-em-docs/specs> [opcoes]
//
// Opcoes:
//   --feature <nome>        pasta da feature em docs/specs/ (nome exato ou trecho unico)
//   --max <N>               sessoes no maximo nesta rodada (default 99; 1 = ensaio)
//   --model <id>            modelo das sessoes (default: o da conta)
//   --budget <usd>          teto de gasto por sessao (--max-budget-usd); default sem teto
//   --permission-mode <m>   auto | acceptEdits | dontAsk (default auto). Sem humano para aprovar,
//                           o que nao estiver liberado nas regras do settings e negado: o ensaio
//                           (--max 1) mostra as regras que faltam.
//   --log <dir>             onde gravar os JSONs (default: <tmp>/praxis-loop-driver/<feature>)
//   --dry-run               mostra a proxima fatia e o prompt, sem rodar nada
//
// Pre-condicao: o pacote aprovado no portao final do /tasks (Preflight respondido, "Pacote aprovado em"
// preenchido) e o repositorio na branch declarada nele. Outra branch = o driver nao roda, para o loop de uma feature
// nunca commitar na branch de outra.
//
// Exit codes: 0 fim normal (nada TODO/WIP, --max atingido ou parada pedida pela sessao) ·
//             1 pre-condicao falhou · 2 uso invalido ·
//             4 sessao sem fatia nova em DONE ou relatorio fora do contrato (ler o log antes de seguir)

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const STATUS_RE = /^\|\s*(U[0-9][0-9A-Za-z.]*)\s*\|\s*`?(TODO|WIP|DONE|BLOCKED|ABANDONADA)`?/;

function parseArgs(argv) {
  const opts = { max: 99, permissionMode: 'auto', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) usage(`valor ausente para ${a}`);
      return v;
    };
    if (a === '--feature') opts.feature = next();
    else if (a === '--max') opts.max = Number(next());
    else if (a === '--model') opts.model = next();
    else if (a === '--budget') opts.budget = Number(next());
    else if (a === '--permission-mode') opts.permissionMode = next();
    else if (a === '--log') opts.log = next();
    else if (a === '--dry-run') opts.dryRun = true;
    else usage(`opcao desconhecida: ${a}`);
  }
  if (!opts.feature) usage('--feature e obrigatorio');
  if (!Number.isInteger(opts.max) || opts.max < 1) usage('--max precisa ser inteiro >= 1');
  if (opts.budget !== undefined && !(opts.budget > 0)) usage('--budget precisa ser > 0');
  if (!['auto', 'acceptEdits', 'dontAsk'].includes(opts.permissionMode)) usage('--permission-mode: auto | acceptEdits | dontAsk');
  return opts;
}

function usage(msg) {
  console.error(`loop-driver: ${msg}`);
  console.error('uso: node .claude/scripts/loop-driver.mjs --feature <nome> [--max N] [--model id] [--budget usd] [--permission-mode m] [--log dir] [--dry-run]');
  process.exit(2);
}

function fail(msg) {
  console.error(`loop-driver: ${msg}`);
  process.exit(1);
}

function resolveFeature(name) {
  const specs = join(ROOT, 'docs', 'specs');
  if (!existsSync(specs)) fail(`nao achei docs/specs/ em ${ROOT} — rode da raiz do projeto`);
  if (existsSync(join(specs, name, 'tasks.md'))) return name;
  const hits = readdirSync(specs).filter((d) => d.includes(name) && existsSync(join(specs, d, 'tasks.md')));
  if (hits.length === 1) return hits[0];
  if (!hits.length) fail(`nenhuma feature com tasks.md casa com "${name}" em docs/specs/`);
  fail(`"${name}" casa com mais de uma feature: ${hits.join(', ')}`);
}

function readStates(tasksPath) {
  const states = [];
  for (const line of readFileSync(tasksPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(STATUS_RE);
    if (m) states.push({ fatia: m[1], status: m[2] });
  }
  return states;
}

// Valor de uma linha "| **Campo** | valor |" do Preflight, ou null quando vazia ("—").
function preflightField(tasksPath, campo) {
  const re = new RegExp(`^\\|\\s*\\*\\*${campo}\\*\\*\\s*\\|\\s*([^|]*?)\\s*\\|`, 'm');
  const m = readFileSync(tasksPath, 'utf8').match(re);
  const value = m ? m[1].replace(/`/g, '').trim() : '';
  return !value || value === '—' || value === '-' ? null : value;
}

function preflightBranch(tasksPath) {
  // "feature/x, criada de main" -> "feature/x"
  const value = preflightField(tasksPath, 'Branch');
  return value ? value.split(/\s+/)[0].replace(/[,;.]+$/, '') : null;
}

function currentBranch() {
  // symbolic-ref funciona em repositorio ainda sem commit; HEAD destacado (sem branch) cai na trava de branch.
  const r = spawnSync('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  if (r.error) fail(`nao consegui rodar o git: ${r.error.message}`);
  if (r.status === 0) return r.stdout.trim();
  const inside = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, encoding: 'utf8' });
  if (inside.status !== 0) fail(`${ROOT} nao e um repositorio git`);
  return '(HEAD destacado)';
}

function buildPrompt(feature) {
  return [
    `/execute ${feature} --driver`,
    '',
    'EXECUCAO PELO DRIVER (.claude/scripts/loop-driver.mjs): esta sessao e nao interativa e termina ao fim',
    'da fatia. Siga a secao "--driver" da skill /execute. A ULTIMA linha do relatorio e sempre uma destas, sozinha:',
    'DRIVER: CONTINUAR',
    'DRIVER: PARAR - <motivo em uma frase>',
  ].join('\n');
}

function lastLine(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : '';
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const feature = resolveFeature(opts.feature);
  const tasksPath = join(ROOT, 'docs', 'specs', feature, 'tasks.md');

  if (!preflightField(tasksPath, 'Pacote aprovado em')) fail(`o pacote de ${feature} nao foi aprovado (Preflight › Pacote aprovado em) — rode o portao final do /tasks`);
  const branch = preflightBranch(tasksPath);
  if (!branch) fail(`o Preflight de ${feature}/tasks.md nao tem Branch respondida — rode o portao final do /tasks`);
  const atual = currentBranch();
  if (atual !== branch) {
    const msg = `o repositorio esta na branch '${atual}' e o Preflight de ${feature} declara '${branch}'`;
    if (opts.dryRun) console.warn(`aviso: ${msg}`);
    else fail(`${msg}. Troque de branch e rode de novo.`);
  }

  const prompt = buildPrompt(feature);
  const logDir = opts.log || join(tmpdir(), 'praxis-loop-driver', feature);

  for (let i = 1; i <= opts.max; i++) {
    const antes = readStates(tasksPath);
    if (!antes.length) fail(`nao achei o Loop Log (| U0 | TODO | ...) em ${feature}/tasks.md`);
    const pendentes = antes.filter((s) => s.status === 'TODO' || s.status === 'WIP');
    if (!pendentes.length) { console.log('Nenhuma fatia TODO ou WIP no Loop Log: fim do loop.'); return; }
    const alvo = pendentes[0].fatia;

    if (opts.dryRun) { console.log(`Proxima fatia: ${alvo}\n----\n${prompt}`); return; }

    mkdirSync(logDir, { recursive: true });
    const saida = join(logDir, `${stamp()}-s${i}-${alvo}.json`);
    console.log(`[${new Date().toLocaleString()}] ${alvo}: sessao nova (${i} de no maximo ${opts.max})`);

    const args = ['-p', '--permission-mode', opts.permissionMode, '--output-format', 'json'];
    if (opts.model) args.push('--model', opts.model);
    if (opts.budget) args.push('--max-budget-usd', String(opts.budget));
    // O prompt vai pela entrada padrao: argumento com quebra de linha nao sobrevive ao shim do Windows.
    // PRAXIS_DRIVER=1: a sessao filha nao checa nem aplica atualizacao do catalogo no meio da corrida (ADR-0009)
    const r = spawnSync('claude', args, {
      cwd: ROOT, input: prompt, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, PRAXIS_DRIVER: '1' },
    });
    if (r.error) fail(`nao consegui rodar o claude: ${r.error.message}`);
    writeFileSync(saida, r.stdout || '', 'utf8');

    let resultado = null;
    try { resultado = JSON.parse(r.stdout); } catch { /* relatorio fora do formato: tratado abaixo */ }
    const depois = readStates(tasksPath);
    const novas = depois.filter((s) => s.status === 'DONE' && antes.find((a) => a.fatia === s.fatia)?.status !== 'DONE');
    const custo = typeof resultado?.total_cost_usd === 'number' ? resultado.total_cost_usd.toFixed(2) : '?';
    console.log(`[${new Date().toLocaleString()}] ${alvo}: DONE nesta sessao = [${novas.map((s) => s.fatia).join(', ')}]; custo US$ ${custo}; log ${saida}`);

    const ultima = lastLine(resultado?.result);
    if (/^DRIVER: PARAR/.test(ultima)) { console.log(`Parada pedida pela sessao: ${ultima}`); return; }
    if (!novas.length) { console.log('A sessao terminou sem fatia nova em DONE: leia o relatorio no log.'); process.exit(4); }
    if (!/^DRIVER: CONTINUAR/.test(ultima)) { console.log('O relatorio nao terminou com a linha do driver: leia o log antes de seguir.'); process.exit(4); }
  }
  console.log(`Chegou ao --max ${opts.max} desta rodada.`);
}

main();
