#!/usr/bin/env node
// loop-doctor.mjs — Gate 0 do /execute: ambiente + frescor dos Fatos, ANTES de gastar iteracao.
//
// Roda na Regra 0 do /execute (inicio de toda corrida e de toda retomada de sessao). Um [FALHOU]
// global e parada de primeira classe: descobrir que o banco esta fora do ar na U3 custa tres
// iteracoes; descobrir aqui custa um segundo.
//
// A feature e ENTRADA, nao conteudo: o script nao conhece nenhuma feature. Checagens gerais vivem
// aqui; as da feature vivem como DADO em docs/specs/<feature>/doctor.json (opcional, gerado no
// portao final do /tasks a partir da Infra de Verificacao do plan — molde em
// docs/templates/doctor-template.json). Duas features em paralelo nunca disputam este arquivo.
//
// Checagens gerais:
//   1. Pacote aprovado — tasks.md com "Pacote aprovado em" preenchido.
//   2. Branch — o repositorio esta na branch do Preflight.
//   3. Frescor dos Fatos — todo arquivo:linha da secao "Fatos Confirmados" do plan.md ainda existe
//      (arquivo presente e com pelo menos aquela linha). Fato velho = o loop re-adivinharia.
//   4. Ferramentas dos Gates — o primeiro comando de cada gate do tasks.md esta no PATH (AVISO).
// Checagens da feature (doctor.json): tipo porta | http | conteudo | comando; severidade
// FALHOU (default) | AVISO; "fatias": [...] restringe a falha a essas fatias (viram BLOCKED e a
// corrida segue com as demais) — sem "fatias", a falha para a corrida.
//
// Uso: node .claude/scripts/loop-doctor.mjs --feature <pasta-em-docs/specs> [--json]
// Exit: 0 ok (ou so AVISO) · 1 FALHOU global (para a corrida) · 3 so FALHOU restrito a fatias ·
//       2 uso invalido ou erro do proprio script (ex.: doctor.json malformado) — tambem para a corrida

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { connect } from 'node:net';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const json = args.includes('--json');
const featureArg = args[args.indexOf('--feature') + 1];
if (!args.includes('--feature') || !featureArg || featureArg.startsWith('--')) {
  console.error('uso: node .claude/scripts/loop-doctor.mjs --feature <nome> [--json]');
  process.exit(2);
}

const results = []; // { num, nome, status: OK|AVISO|FALHOU, detalhe, fatias? }
const add = (nome, status, detalhe, fatias) => results.push({ num: results.length + 1, nome, status, detalhe, ...(fatias ? { fatias } : {}) });

function resolveFeature(name) {
  const specs = join(ROOT, 'docs', 'specs');
  if (!existsSync(specs)) return null;
  if (existsSync(join(specs, name, 'tasks.md'))) return name;
  const hits = readdirSync(specs).filter((d) => d.includes(name) && existsSync(join(specs, d, 'tasks.md')));
  return hits.length === 1 ? hits[0] : null;
}

function preflightField(tasks, campo) {
  const m = tasks.match(new RegExp(`^\\|\\s*\\*\\*${campo}\\*\\*\\s*\\|\\s*([^|]*?)\\s*\\|`, 'm'));
  const v = m ? m[1].replace(/`/g, '').trim() : '';
  return !v || v === '—' || v === '-' ? null : v;
}

function section(md, titleRe) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s/.test(l) && titleRe.test(l));
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

function onPath(cmd) {
  const r = process.platform === 'win32'
    ? spawnSync('where', [cmd], { encoding: 'utf8' })
    : spawnSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' });
  return r.status === 0;
}

function checkPort(port, host = '127.0.0.1', timeout = 2000) {
  return new Promise((done) => {
    const s = connect({ port, host });
    const end = (ok) => { s.destroy(); done(ok); };
    s.setTimeout(timeout, () => end(false));
    s.once('connect', () => end(true));
    s.once('error', () => end(false));
  });
}

async function checkHttp(url, timeout = 5000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    return { ok: r.status < 500, detalhe: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, detalhe: e.name === 'TimeoutError' ? 'timeout' : e.message };
  }
}

async function main() {
  const feature = resolveFeature(featureArg);
  if (!feature) { add('Feature', 'FALHOU', `nenhuma (ou mais de uma) pasta em docs/specs com tasks.md casa com "${featureArg}"`); return finish(); }
  const dir = join(ROOT, 'docs', 'specs', feature);
  const tasks = readFileSync(join(dir, 'tasks.md'), 'utf8');

  // 1. pacote aprovado
  const aprovado = preflightField(tasks, 'Pacote aprovado em');
  add('Pacote aprovado', aprovado ? 'OK' : 'FALHOU', aprovado ? `em ${aprovado}` : 'Preflight › "Pacote aprovado em" vazio — rodar o portao final do /tasks');

  // 2. branch
  const branchDecl = (preflightField(tasks, 'Branch') || '').split(/\s+/)[0].replace(/[,;.]+$/, '');
  const head = spawnSync('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  const atual = head.status === 0 ? head.stdout.trim() : '(HEAD destacado ou sem git)';
  if (!branchDecl) add('Branch', 'FALHOU', 'Preflight › Branch sem resposta');
  else add('Branch', atual === branchDecl ? 'OK' : 'FALHOU', atual === branchDecl ? atual : `repositorio em '${atual}', Preflight declara '${branchDecl}'`);

  // 3. frescor dos Fatos Confirmados
  const planPath = join(dir, 'plan.md');
  if (!existsSync(planPath)) {
    add('Fatos Confirmados', 'FALHOU', 'plan.md ausente');
  } else {
    const rows = section(readFileSync(planPath, 'utf8'), /Fatos Confirmados/i) || [];
    const refs = [];
    for (const row of rows.filter((l) => l.trim().startsWith('|'))) {
      for (const m of row.matchAll(/`?([\w@./\\-]+\.[A-Za-z0-9]+):(\d+)`?/g)) refs.push({ arquivo: m[1].replace(/\\/g, '/'), linha: Number(m[2]) });
    }
    const velhos = [];
    for (const r of refs) {
      const abs = isAbsolute(r.arquivo) ? r.arquivo : join(ROOT, r.arquivo);
      if (!existsSync(abs)) { velhos.push(`${r.arquivo}:${r.linha} (arquivo nao existe)`); continue; }
      const linhas = readFileSync(abs, 'utf8').split(/\r?\n/);
      if (linhas.length && linhas[linhas.length - 1] === '') linhas.pop(); // quebra de linha final nao e linha
      const n = linhas.length;
      if (r.linha > n) velhos.push(`${r.arquivo}:${r.linha} (arquivo tem ${n} linhas)`);
    }
    if (!refs.length) add('Fatos Confirmados', 'AVISO', 'nenhuma referencia arquivo:linha na secao — o loop vai re-adivinhar');
    else add('Fatos Confirmados', velhos.length ? 'FALHOU' : 'OK', velhos.length ? `${velhos.length}/${refs.length} referencias velhas: ${velhos.join('; ')} — re-pinar no plan antes de rodar` : `${refs.length} referencias conferidas`);
  }

  // 4. ferramentas dos gates
  const gateRows = (section(tasks, /^##\s+Gates/i) || []).filter((l) => l.trim().startsWith('|') && !/^\|\s*-/.test(l.trim()) && !/Camada/i.test(l));
  const tools = new Set();
  for (const row of gateRows) for (const m of row.matchAll(/`([^`]+)`/g)) {
    const first = m[1].trim().split(/\s+/)[0];
    if (first && !first.startsWith('/') && !first.startsWith('{')) tools.add(first);
  }
  const ausentes = [...tools].filter((t) => !onPath(t));
  if (!tools.size) add('Ferramentas dos gates', 'AVISO', 'tabela Gates sem comando literal entre crases');
  else add('Ferramentas dos gates', ausentes.length ? 'AVISO' : 'OK', ausentes.length ? `fora do PATH: ${ausentes.join(', ')}` : [...tools].join(', '));

  // 5+. checagens da feature (doctor.json)
  const docPath = join(dir, 'doctor.json');
  if (existsSync(docPath)) {
    let cfg;
    try { cfg = JSON.parse(readFileSync(docPath, 'utf8')); } catch (e) { add('doctor.json', 'FALHOU', `JSON invalido: ${e.message}`); return finish(); }
    for (const c of cfg.checks || []) {
      const sev = c.severidade === 'AVISO' ? 'AVISO' : 'FALHOU';
      let ok = false; let detalhe = '';
      if (c.tipo === 'porta') { ok = await checkPort(Number(c.porta), c.host); detalhe = `porta ${c.porta} ${ok ? 'aberta' : 'fechada'}`; }
      else if (c.tipo === 'http') { const r = await checkHttp(c.url, c.timeout ? c.timeout * 1000 : 5000); ok = r.ok; detalhe = `${c.url} → ${r.detalhe}`; }
      else if (c.tipo === 'conteudo') {
        const abs = join(ROOT, c.arquivo);
        ok = existsSync(abs) && new RegExp(c.padrao, 'm').test(readFileSync(abs, 'utf8'));
        detalhe = `${c.arquivo} ${ok ? 'contem' : 'NAO contem'} /${c.padrao}/`;
      } else if (c.tipo === 'comando') {
        const r = spawnSync(c.comando, { cwd: ROOT, shell: true, encoding: 'utf8', timeout: (c.timeout || 60) * 1000 });
        ok = !r.error && r.status === 0; detalhe = `\`${c.comando}\` → exit ${r.error ? 'erro' : r.status}`;
      } else { add(c.nome || '(sem nome)', 'FALHOU', `tipo desconhecido: ${c.tipo}`); continue; }
      add(c.nome || c.tipo, ok ? 'OK' : sev, `${c.descricao ? c.descricao + ' — ' : ''}${detalhe}`, !ok && Array.isArray(c.fatias) ? c.fatias : undefined);
    }
  }
  return finish();
}

function finish() {
  const global = results.some((r) => r.status === 'FALHOU' && !r.fatias);
  const scoped = results.filter((r) => r.status === 'FALHOU' && r.fatias);
  if (json) {
    process.stdout.write(JSON.stringify({ results, paraCorrida: global, fatiasBloqueadas: [...new Set(scoped.flatMap((r) => r.fatias))] }, null, 2) + '\n');
  } else {
    for (const r of results) console.log(`[${r.status}] #${r.num} ${r.nome} — ${r.detalhe}${r.fatias ? ` (bloqueia ${r.fatias.join(', ')})` : ''}`);
    if (global) console.log('\nGate 0 VERMELHO: corrigir o [FALHOU] antes da corrida.');
    else if (scoped.length) console.log(`\nGate 0 parcial: fatias BLOCKED de largada — ${[...new Set(scoped.flatMap((r) => r.fatias))].join(', ')}.`);
    else console.log('\nGate 0 verde.');
  }
  process.exit(global ? 1 : scoped.length ? 3 : 0);
}

main().catch((e) => { console.error(`loop-doctor: ${e.message}`); process.exit(2); });
