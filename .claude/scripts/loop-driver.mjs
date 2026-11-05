#!/usr/bin/env node
// loop-driver.mjs — O gerente do /execute: uma fatia por sessao nova do Claude Code, verificada por
// outra sessao, ate acabar ou ate uma parada real. E o caminho padrao do loop (ADR-0007).
//
// Por que existe: com o loop numa sessao so, cada chamada rele tudo o que veio antes — o custo cresce
// com o contexto acumulado, nao com o trabalho. Aqui o gerente e um script (zero token, zero
// contexto): escolhe a fatia, monta o recorte, abre a sessao, roda os gates, abre o verificador e
// decide seguir, repetir ou parar. O tasks.md (Loop Log) e o git sao o estado; cada sessao comeca
// vazia e le so o recorte da sua fatia.
//
// Por iteracao:
//   1. Gate 0 (loop-doctor.mjs): falha global para a rodada; falha restrita deixa as fatias BLOCKED.
//   2. Escolhe a proxima fatia TODO/WIP liberada no grafo ("Depende de" todas DONE); grupo liberado
//      no Preflight (multi-agente) vai inteiro numa sessao.
//   3. Sessao da fatia: protocolo (.claude/skills/execute/slice-session.md) + cabecalho da rodada +
//      recorte (loop-briefing.mjs), no "Modelo · esforço" da fatia, sem leitura de PRD e guia.
//      Terminou sem DONE, sem pedir parada, mas com trabalho feito: uma continuacao automatica.
//   4. Gates objetivos (slice-gates.mjs): FALHOU reprova sem gastar o verificador.
//   5. Verificador: outra sessao, sem o historico de quem implementou, sem edicao nem commit
//      (.claude/skills/execute/verifier-session.md). Reprovada: a fatia volta para WIP e repete uma
//      vez, um degrau de modelo acima, com os achados no prompt. Reprovada de novo: para.
//   6. Custo, pico de contexto e resultado de cada sessao na tabela "Custo por sessão (driver)".
// BLOCKED nao para a rodada: segue com a proxima liberada.
//
// Uso: node .claude/scripts/loop-driver.mjs --feature <pasta-em-docs/specs> [opcoes]
//   --max <N>                 sessoes de fatia nesta rodada (default 99; 1 = ensaio / checkpoint)
//   --model <id|alias>        modelo de todas as sessoes de fatia (ignora o declarado nas fatias)
//   --verifier-model <id>     modelo do verificador (default: o da conta)
//   --verifier-effort <nivel> esforco do verificador: low|medium|high|xhigh|max (default medium)
//   --team <front|back|db|full>  escopo do team, repassado a sessao (default full)
//   --from <U«n»>             comeca por esta fatia (precisa estar TODO/WIP e liberada); depois, a ordem normal
//   --budget <usd>            teto de gasto por sessao (--max-budget-usd); default sem teto
//   --permission-mode <m>     auto | acceptEdits | dontAsk (default auto). Sem humano para aprovar, o
//                             que o settings nao libera e negado: o ensaio (--max 1) mostra o que falta
//   --deny <glob,...>         arquivos alem de docs/prds/** e do guia que a sessao da fatia nao le
//   --timeout <min>           teto de cada comando de gate (default 20)
//   --log <dir>               JSON de cada sessao (default: <tmp>/praxis-loop-driver/<feature>)
//   --dry-run                 mostra Gate 0, a proxima fatia, o modelo e o prompt, sem rodar sessao
// Variavel: PRAXIS_CLAUDE_BIN troca o executavel do claude (um .mjs roda com o node — usado em teste).
//
// Exit: 0 acabou (toda fatia DONE ou ABANDONADA) · 1 pre-condicao (pacote, branch, Gate 0, protocolo,
//       claude) · 2 uso invalido · 3 parada pedida pela sessao (decisao humana; motivo na saida) ·
//       4 sessao fora do contrato (sem DONE nem BLOCKED, sem a linha do driver, verificador sem
//       veredito) · 5 sobraram so fatias BLOCKED ou sem dependencia liberada · 6 fatia reprovada duas
//       vezes pelo verificador · 7 chegou ao --max

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  read, resolveFeature, featurePaths, preflightField, preflightBranch, loopLog, setStatus, setNote, slices,
  groups, liberatedGroups, currentBranch, snapshot, changedSince, appendCostRow, projectMode,
} from './lib/loop-artifacts.mjs';
import { buildBriefing } from './loop-briefing.mjs';
import { runGates } from './slice-gates.mjs';

const ROOT = process.cwd();
const HERE = dirname(fileURLToPath(import.meta.url));
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];

// --- argumentos --------------------------------------------------------------------------------------

function usage(msg) {
  console.error(`loop-driver: ${msg}`);
  console.error('uso: node .claude/scripts/loop-driver.mjs --feature <nome> [--max N] [--model id] [--verifier-model id] [--verifier-effort nivel] [--team t] [--from U«n»] [--budget usd] [--permission-mode m] [--deny globs] [--timeout min] [--log dir] [--dry-run]');
  process.exit(2);
}

function parseArgs(argv) {
  const o = { max: 99, permissionMode: 'auto', verifierEffort: 'medium', team: 'full', deny: [], timeout: 20, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) usage(`valor ausente para ${a}`); return v; };
    if (a === '--feature') o.feature = next();
    else if (a === '--max') o.max = Number(next());
    else if (a === '--model') o.model = next();
    else if (a === '--verifier-model') o.verifierModel = next();
    else if (a === '--verifier-effort') o.verifierEffort = next();
    else if (a === '--team') o.team = next();
    else if (a === '--from') o.from = next();
    else if (a === '--budget') o.budget = Number(next());
    else if (a === '--permission-mode') o.permissionMode = next();
    else if (a === '--deny') o.deny = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--timeout') o.timeout = Number(next());
    else if (a === '--log') o.log = next();
    else if (a === '--dry-run') o.dryRun = true;
    else usage(`opcao desconhecida: ${a}`);
  }
  if (!o.feature) usage('--feature e obrigatorio');
  if (!Number.isInteger(o.max) || o.max < 1) usage('--max precisa ser inteiro >= 1');
  if (o.budget !== undefined && !(o.budget > 0)) usage('--budget precisa ser > 0');
  if (!(o.timeout > 0)) usage('--timeout precisa ser > 0');
  if (!['auto', 'acceptEdits', 'dontAsk'].includes(o.permissionMode)) usage('--permission-mode: auto | acceptEdits | dontAsk');
  if (!EFFORTS.includes(o.verifierEffort)) usage(`--verifier-effort: ${EFFORTS.join(' | ')}`);
  if (!['front', 'back', 'db', 'full'].includes(o.team)) usage('--team: front | back | db | full');
  return o;
}

// --- saida ---------------------------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');
const when = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const stamp = (d = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const say = (t) => console.log(`[${when()}] ${t}`);

let totalCost = 0;
const doneThisRun = [];

function finish(code, text) {
  console.log('');
  if (doneThisRun.length) console.log(`Fatias aprovadas nesta rodada: ${doneThisRun.join(', ')}`);
  console.log(`Custo das sessoes desta rodada (preco de tabela): US$ ${totalCost.toFixed(2)}`);
  console.log(`RESULTADO: ${code} — ${text}`);
  process.exit(code);
}

// --- claude ------------------------------------------------------------------------------------------

// No Windows o claude costuma ser um shim .cmd, que so roda pelo shell: o comando vai montado e
// citado aqui (as regras de permissao tem espaco e parenteses).
const winQuote = (a) => (/^[\w./:=@-]+$/.test(a) ? a : `"${a.replace(/"/g, '\\"')}"`);

function runClaude(prompt, args) {
  const bin = process.env.PRAXIS_CLAUDE_BIN || 'claude';
  const env = { ...process.env, PRAXIS_DRIVER: '1' };
  const opts = { cwd: ROOT, input: prompt, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env };
  let r;
  if (/\.m?js$/i.test(bin)) r = spawnSync(process.execPath, [bin, ...args], opts);
  else if (process.platform === 'win32') r = spawnSync([bin, ...args].map(winQuote).join(' '), { ...opts, shell: true });
  else r = spawnSync(bin, args, opts);
  if (r.error) return { error: r.error.message, stdout: '' };
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* fora do formato: tratado por quem chama */ }
  return { json, stdout: r.stdout || '', stderr: r.stderr || '', status: r.status };
}

function lastLines(text, n = 2) {
  return String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(-n);
}

/** Pico de contexto da sessao (input + cache lido + cache escrito), lido do transcript. Melhor esforco. */
function contextPeak(sessionId) {
  if (!sessionId) return null;
  const base = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
  const f = join(base, 'projects', ROOT.replace(/[^a-zA-Z0-9]/g, '-'), `${sessionId}.jsonl`);
  if (!existsSync(f)) return null;
  let peak = 0;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!line.includes('"usage"')) continue;
    let sum = 0;
    for (const k of ['input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens']) {
      const m = line.match(new RegExp(`"${k}":(\\d+)`));
      if (m) sum += Number(m[1]);
    }
    if (sum > peak) peak = sum;
  }
  return peak || null;
}

// --- modelo --------------------------------------------------------------------------------------------

const modelRank = (m) => (!m ? 0 : /haiku/i.test(m) ? 1 : /sonnet/i.test(m) ? 2 : 3);

/** Modelo e esforco do grupo: o mais forte declarado entre as fatias (na duvida, o degrau de cima). */
function declared(sl, ids) {
  let model = null; let effort = null;
  for (const id of ids) {
    const s = sl.find((x) => x.id === id);
    if (s?.model && modelRank(s.model) > modelRank(model)) model = s.model;
    if (s?.effort && EFFORTS.indexOf(s.effort) > EFFORTS.indexOf(effort)) effort = s.effort;
  }
  return { model, effort };
}

/** Um degrau acima: modelo menor (ou o da conta) → opus · high; opus → mais esforco. */
function stepUp(model, effort) {
  if (modelRank(model) < 3) return { model: 'opus', effort: 'high' };
  const i = EFFORTS.indexOf(effort || 'high');
  return { model, effort: EFFORTS[Math.max(Math.min(i + 1, EFFORTS.length - 1), EFFORTS.indexOf('high'))] };
}

const describe = (m, e) => (m ? `${m}${e ? ` · ${e}` : ''}` : `modelo da conta${e ? ` · ${e}` : ''}`);

// --- rodada --------------------------------------------------------------------------------------------

function main() {
  const o = parseArgs(process.argv.slice(2));
  let feature;
  try { feature = resolveFeature(ROOT, o.feature); } catch (e) { console.error(`loop-driver: ${e.message}`); process.exit(1); }
  const paths = featurePaths(ROOT, feature);
  const fail = (msg) => { console.error(`loop-driver: ${msg}`); process.exit(1); };

  const tasks0 = read(paths.tasks);
  if (!preflightField(tasks0, 'Pacote aprovado em')) fail(`o pacote de ${feature} nao foi aprovado (Preflight › Pacote aprovado em) — rode o portao final do /tasks`);
  const branch = preflightBranch(tasks0);
  if (!branch) fail(`o Preflight de ${feature}/tasks.md nao tem Branch respondida — rode o portao final do /tasks`);
  const atual = currentBranch(ROOT);
  if (atual !== branch) {
    const msg = `o repositorio esta na branch '${atual}' e o Preflight de ${feature} declara '${branch}'`;
    if (o.dryRun) console.warn(`aviso: ${msg}`); else fail(`${msg}. Troque de branch e rode de novo.`);
  }
  const protocolPath = join(ROOT, '.claude', 'skills', 'execute', 'slice-session.md');
  const verifierPath = join(ROOT, '.claude', 'skills', 'execute', 'verifier-session.md');
  const doctorPath = join(HERE, 'loop-doctor.mjs');
  for (const f of [protocolPath, verifierPath, doctorPath]) if (!existsSync(f)) fail(`nao achei ${f} — rode: node .claude/praxis/praxis.mjs add execute`);
  const protocol = read(protocolPath);
  const verifierProtocol = read(verifierPath);
  const lite = projectMode(ROOT) === 'lite';
  const logDir = o.log || join(tmpdir(), 'praxis-loop-driver', feature);

  const posix = (p) => p.replace(/\\/g, '/');
  const readDeny = ['./docs/prds/**', `./docs/specs/${posix(feature)}/guia-de-validacao.md`, ...o.deny.map((g) => (g.startsWith('./') || g.startsWith('/') ? g : `./${g}`))].map((g) => `Read(${g})`);
  const verifierDeny = ['Edit', 'Write', 'NotebookEdit', ...['commit', 'push', 'reset', 'checkout', 'switch', 'restore', 'stash', 'rebase', 'merge', 'cherry-pick'].map((c) => `Bash(git ${c} *)`), ...readDeny];

  function sessionArgs(model, effort, deny) {
    const a = ['-p', '--permission-mode', o.permissionMode, '--output-format', 'json'];
    if (model) a.push('--model', model);
    if (effort) a.push('--effort', effort);
    if (o.budget) a.push('--max-budget-usd', String(o.budget));
    if (deny.length) a.push('--disallowedTools', deny.join(','));
    return a;
  }

  function session(kind, ids, prompt, model, effort, deny) {
    mkdirSync(logDir, { recursive: true });
    const file = join(logDir, `${stamp()}-${ids.join('+')}-${kind}.json`);
    const r = runClaude(prompt, sessionArgs(model, effort, deny));
    writeFileSync(file, r.stdout || r.stderr || r.error || '', 'utf8');
    if (r.error) fail(`nao consegui rodar o claude: ${r.error}`);
    const cost = typeof r.json?.total_cost_usd === 'number' ? r.json.total_cost_usd : null;
    if (cost !== null) totalCost += cost;
    const peak = contextPeak(r.json?.session_id);
    return { result: r.json?.result ?? '', json: r.json, file, cost, peak, turns: r.json?.num_turns };
  }

  function costRow(ids, papel, desc, s, resultado) {
    appendCostRow(paths.tasks, [when(), ids.join('+'), papel, desc, s.cost === null ? '?' : s.cost.toFixed(2), s.peak ? `${Math.round(s.peak / 1000)}k` : '?', s.turns ?? '?', resultado]);
  }

  function header(ids, base, desc, extra = []) {
    return ['', '---', '', '## RODADA (loop-driver.mjs)', '',
      `FEATURE: ${feature}`,
      `FATIAS: ${ids.join(', ')}${ids.length > 1 ? ' (grupo liberado no Preflight)' : ''}`,
      `BASE: ${base} (diff desta iteracao: git diff ${base})`,
      `TEAM: ${o.team}`,
      `MODO DO PROJETO: ${lite ? 'lite' : 'full'}`,
      `MODELO: ${desc}`, ...extra, ''].join('\n');
  }

  let retry = null; // { ids:Set, achados, model, effort }
  let sessions = 0;

  for (;;) {
    // 1. Gate 0
    const doc = spawnSync(process.execPath, [doctorPath, '--feature', feature, '--json'], { cwd: ROOT, encoding: 'utf8' });
    let g0 = null;
    try { g0 = JSON.parse(doc.stdout); } catch { /* exit 2 sem JSON */ }
    if (doc.status === 1 || doc.status === 2 || !g0) {
      const falhas = (g0?.results || []).filter((r) => r.status === 'FALHOU').map((r) => `${r.nome}: ${r.detalhe}`);
      if (o.dryRun) console.warn(`aviso: Gate 0 vermelho — ${falhas.join('; ') || (doc.stderr || '').trim()}`);
      else { console.error(`Gate 0 VERMELHO:\n  ${falhas.join('\n  ') || (doc.stderr || '').trim()}`); finish(1, 'Gate 0 vermelho: corrigir antes da corrida'); }
    }
    if (doc.status === 3 && !o.dryRun) {
      for (const r of g0.results.filter((x) => x.status === 'FALHOU' && x.fatias)) {
        for (const id of r.fatias) {
          const row = loopLog(read(paths.tasks)).find((x) => x.id === id);
          if (row && (row.status === 'TODO' || row.status === 'WIP')) {
            setStatus(paths.tasks, id, 'BLOCKED', `Gate 0: ${r.nome} — ${r.detalhe}`);
            say(`${id}: BLOCKED de largada (Gate 0: ${r.nome})`);
          }
        }
      }
    }

    // 2. proxima fatia liberada
    const tasks = read(paths.tasks);
    const log = loopLog(tasks);
    if (!log.length) fail(`nao achei o Loop Log (| U0 | \`TODO\` | ...) em ${feature}/tasks.md`);
    const sl = slices(tasks);
    const status = (id) => log.find((r) => r.id === id)?.status;
    const pending = log.filter((r) => r.status === 'TODO' || r.status === 'WIP');
    if (!pending.length) {
      const blocked = log.filter((r) => r.status === 'BLOCKED').map((r) => r.id);
      if (blocked.length) finish(5, `sobraram so fatias BLOCKED: ${blocked.join(', ')} (motivos nas Notas do Loop Log)`);
      finish(0, 'nenhuma fatia TODO ou WIP no Loop Log');
    }
    const freed = (id) => (sl.find((s) => s.id === id)?.deps || []).every((d) => status(d) === undefined || status(d) === 'DONE');
    const liberated = pending.filter((r) => freed(r.id));
    if (!liberated.length) {
      const why = pending.map((r) => `${r.id} espera ${(sl.find((s) => s.id === r.id)?.deps || []).filter((d) => status(d) !== 'DONE').map((d) => `${d} (${status(d)})`).join(', ')}`);
      finish(5, `nenhuma fatia liberada: ${why.join('; ')}`);
    }
    const from = o.from && liberated.find((r) => r.id === o.from);
    if (o.from && !from && sessions === 0) finish(5, `--from ${o.from}: a fatia nao esta TODO/WIP com as dependencias DONE`);
    const first = (sessions === 0 && from) || liberated.find((r) => r.status === 'WIP') || liberated[0];
    let ids = [first.id];
    const gmap = groups(tasks);
    const gname = liberatedGroups(tasks).find((g) => (gmap.get(g) || []).includes(first.id));
    if (gname) ids = liberated.map((r) => r.id).filter((id) => gmap.get(gname).includes(id));
    if (retry && !ids.some((id) => retry.ids.has(id))) retry = null;

    if (sessions >= o.max) finish(7, `chegou ao --max ${o.max}; proxima seria ${ids.join(', ')}`);

    // 3. modelo e prompt
    let { model, effort } = declared(sl, ids);
    let origem = model ? 'declarado na fatia' : 'fatia sem "Modelo · esforço"';
    if (o.model) { model = o.model; effort = null; origem = '--model'; }
    if (retry) { ({ model, effort } = retry); origem = 'segunda tentativa, um degrau acima'; }
    const desc = describe(model, effort);
    const base = snapshot(ROOT);
    let briefing;
    try { briefing = buildBriefing(ROOT, feature, ids); } catch (e) { fail(e.message); }
    const extra = retry ? ['', `## SEGUNDA TENTATIVA DE ${ids.join(', ')}`, '',
      'A entrega anterior foi reprovada. Corrija o que esta abaixo, sem refazer o que ja passou, e feche a fatia de novo:', '', retry.achados] : [];
    const prompt = protocol + header(ids, base, `${desc} (${origem})`, extra) + '\n' + briefing;

    if (o.dryRun) {
      console.log(`Proxima: ${ids.join(', ')}${gname ? ` (grupo ${gname})` : ''}\nModelo: ${desc} (${origem})\nPrompt: ${prompt.length} caracteres (recorte ${briefing.length})\nLeitura negada: ${readDeny.join(', ')}\n----\n${prompt}`);
      return;
    }

    sessions++;
    for (const id of ids) if (status(id) === 'TODO') setStatus(paths.tasks, id, 'WIP');
    say(`${ids.join(', ')}: sessao nova (${sessions} de no maximo ${o.max}); ${desc} (${origem})`);
    let s = session('fatia', ids, prompt, model, effort, readDeny);
    const states = () => { const l = loopLog(read(paths.tasks)); return (id) => l.find((r) => r.id === id)?.status; };
    let now = states();
    let newDone = ids.filter((id) => now(id) === 'DONE');
    let newBlocked = ids.filter((id) => now(id) === 'BLOCKED');
    let last = lastLines(s.result, 1)[0] || '';

    // continuacao: parou sem DONE nem BLOCKED, sem pedir parada, mas com trabalho feito
    if (!newDone.length && !newBlocked.length && !/^DRIVER: PARAR/.test(last) && changedSince(ROOT, base)) {
      costRow(ids, 'fatia', desc, s, 'parou sem DONE; continuacao');
      say(`${ids.join(', ')}: parou sem DONE com trabalho feito; sessao de continuacao`);
      const cont = prompt + `\n\n## CONTINUACAO DE ${ids.join(', ')}\n\nA sessao anterior desta fatia parou antes de fechar, com trabalho feito desde ${base} ` +
        `(veja git diff ${base}, git log e git status). NAO refaca o que ja esta feito: termine o que falta (gates, DoD, commit, ` +
        `tasks.md) e feche a fatia. Ultimo relatorio da sessao anterior:\n\n${s.result || '(sem relatorio)'}\n`;
      s = session('continuacao', ids, cont, model, effort, readDeny);
      now = states();
      newDone = ids.filter((id) => now(id) === 'DONE');
      newBlocked = ids.filter((id) => now(id) === 'BLOCKED');
      last = lastLines(s.result, 1)[0] || '';
      costRow(ids, 'continuacao', desc, s, newDone.length ? `DONE ${newDone.join(',')}` : newBlocked.length ? 'BLOCKED' : 'sem DONE');
    } else {
      costRow(ids, 'fatia', desc, s, newDone.length ? `DONE ${newDone.join(',')}` : newBlocked.length ? 'BLOCKED' : 'sem DONE');
    }
    say(`${ids.join(', ')}: DONE = [${newDone.join(', ')}]${newBlocked.length ? `; BLOCKED = [${newBlocked.join(', ')}]` : ''}; custo US$ ${s.cost === null ? '?' : s.cost.toFixed(2)}; log ${s.file}`);
    const parar = /^DRIVER: PARAR/.test(last);

    if (!newDone.length) {
      if (parar) finish(3, `parada pedida pela sessao — ${last.replace(/^DRIVER:\s*/, '')} (relatorio em ${s.file})`);
      if (newBlocked.length) { say(`${newBlocked.join(', ')}: BLOCKED (motivo nas Notas); segue com a proxima liberada`); continue; }
      finish(4, `a sessao terminou sem DONE nem BLOCKED — leia o relatorio em ${s.file}`);
    }

    // 4. gates objetivos
    let gatesRes;
    try { gatesRes = runGates(ROOT, feature, base, { timeoutMin: o.timeout }); } catch (e) { fail(e.message); }
    for (const l of gatesRes.lines.filter((x) => x.startsWith('['))) console.log(`    ${l}`);
    let verdict; let report;
    if (gatesRes.code === 1) {
      verdict = 'VERIFICADOR: REPROVA - gate objetivo falhou';
      report = `Gates objetivos (slice-gates.mjs --since ${base}):\n${gatesRes.lines.join('\n')}`;
    } else {
      // 5. verificador
      const vh = header(newDone, base, describe(o.verifierModel, o.verifierEffort)) +
        `\n## GATES OBJETIVOS (slice-gates.mjs --since ${base}, exit ${gatesRes.code})\n\n${gatesRes.lines.join('\n')}\n`;
      let vBrief;
      try { vBrief = buildBriefing(ROOT, feature, newDone); } catch (e) { fail(e.message); }
      const v = session('verificador', newDone, verifierProtocol + vh + '\n' + vBrief, o.verifierModel, o.verifierEffort, verifierDeny);
      const vl = lastLines(v.result, 2);
      verdict = vl[vl.length - 1] || '';
      report = v.result || '';
      costRow(newDone, 'verificador', describe(o.verifierModel, o.verifierEffort), v, /^VERIFICADOR: (APROVA|REPROVA)/.test(verdict) ? verdict.match(/APROVA|REPROVA/)[0] : 'sem veredito');
    }
    say(`${newDone.join(', ')}: ${verdict || '(sem veredito)'}`);

    if (/^VERIFICADOR: APROVA/.test(verdict)) {
      doneThisRun.push(...newDone);
      if (retry) for (const id of newDone.filter((x) => retry.ids.has(x))) setNote(paths.tasks, id, `aprovada na segunda tentativa (${describe(retry.model, retry.effort)}); a primeira foi reprovada: ${retry.motivo}`);
      retry = null;
      if (parar) finish(3, `parada pedida pela sessao — ${last.replace(/^DRIVER:\s*/, '')}`);
      if (!/^DRIVER: CONTINUAR/.test(last)) finish(4, `o relatorio da sessao nao terminou com a linha do driver — leia ${s.file}`);
      continue;
    }
    if (!/^VERIFICADOR: REPROVA/.test(verdict)) {
      for (const id of newDone) setStatus(paths.tasks, id, 'WIP', 'verificador sem veredito: rodar o driver de novo');
      finish(4, `o verificador nao deu veredito — ${newDone.join(', ')} voltou para WIP (log em ${logDir})`);
    }

    // reprovada: volta para WIP; segunda tentativa um degrau acima, ou para
    const listed = (report.match(/^REPROVADAS:\s*(.+)$/m)?.[1] || '').split(/[,\s]+/).filter((x) => newDone.includes(x));
    const failed = listed.length ? listed : newDone;
    const twice = retry && failed.some((id) => retry.ids.has(id));
    for (const id of failed) setStatus(paths.tasks, id, 'WIP', `reprovada pelo verificador${twice ? ' duas vezes: decisao humana' : ''} (${verdict.replace(/^VERIFICADOR: REPROVA -?\s*/, '')})`);
    doneThisRun.push(...newDone.filter((id) => !failed.includes(id)));
    if (twice) finish(6, `${failed.join(', ')} reprovada(s) duas vezes — relatorio do verificador em ${logDir}`);
    retry = { ids: new Set(failed), achados: report, motivo: verdict.replace(/^VERIFICADOR: REPROVA -?\s*/, ''), ...stepUp(model, effort) };
    say(`${failed.join(', ')}: voltou para WIP; segunda tentativa com ${describe(retry.model, retry.effort)}`);
    if (parar) finish(3, `parada pedida pela sessao — ${last.replace(/^DRIVER:\s*/, '')} (e ${failed.join(', ')} reprovada)`);
  }
}

main();
