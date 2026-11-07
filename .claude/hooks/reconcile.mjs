#!/usr/bin/env node
// reconcile.mjs — hook de USO da memoria de aprendizado (kit Praxis).
//
// Eventos:
//   SessionStart     -> injeta o estado da ultima sessao, a atividade recente do ledger e a COBRANCA
//                       da memoria (ADR-0010): uma linha do memory-check sempre; os problemas
//                       (regra quebrada, fonte morta, vencida, correcao sem regra) no maximo 1x/dia.
//                       As regras ativas NAO sao injetadas aqui: vivem em .claude/rules/learned/ e o
//                       Claude Code as carrega sozinho (por `paths`, ao tocar os arquivos).
//   UserPromptSubmit -> nag discreto se houve trabalho de spec/codigo sem registro semantico
//                       no ledger desde a ultima entrada (llm). Com throttle. Exit 0 SEMPRE
//                       (jamais exit 2 — apagaria o prompt do usuario).
//
// Saida: JSON { hookSpecificOutput: { hookEventName, additionalContext } } via stdout, exit 0.
// Falha graciosa: qualquer erro -> exit 0 sem output (a instrucao e a fonte primaria).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import {
  readStdin, parseInput, getRoot, nowISO,
  readStateFields, writeStateFields, readLedgerEvents,
  WORK_PATH_RE, emitContext,
} from './_lib.mjs';

// O memory-check e asset do nucleo (scripts/lib/kit.mjs › CORE) e chega junto com este hook pelo
// `praxis.mjs apply`. Import dinamico de proposito: projeto ainda sem o arquivo so perde a cobranca,
// nao o resto do contexto de inicio de sessao.
async function loadMemoryCheck(root) {
  const p = join(root, '.claude', 'scripts', 'memory-check.mjs');
  if (!existsSync(p)) return null;
  try { return await import(pathToFileURL(p).href); } catch { return null; }
}

// --- catalogo (ADR-0009): atualizacao pronta + checagem diaria em background ----------------------

function catalogUpdateLine(root) {
  const p = join(root, '.claude', 'praxis.update.json');
  if (!existsSync(p)) return null;
  try {
    const u = JSON.parse(readFileSync(p, 'utf8'));
    return `[Praxis · catalogo] atualizacao ${u.version}${u.major ? ' (MAJOR — so com decisao do usuario: apply --major)' : ''} pronta no cache: `
      + `${u.replace.length} arquivo(s) a substituir, ${u.keep.length} personalizado(s) mantido(s), ${u.add.length} novo(s). `
      + (u.major ? 'Avise uma vez, com o changelog, e espere.' : 'Sem fatia WIP em docs/specs/*/tasks.md → `node .claude/praxis/praxis.mjs apply`, commit separado pela politica do projeto, uma linha ao usuario.');
  } catch { return null; }
}

/** Dispara `praxis.mjs check` desacoplado, no maximo 1x/dia (o proprio script tambem faz o throttle). */
function maybeSpawnCheck(root) {
  if (process.env.PRAXIS_OFFLINE === '1' || process.env.PRAXIS_DRIVER === '1') return;
  const script = join(root, '.claude', 'praxis', 'praxis.mjs');
  if (!existsSync(script) || !existsSync(join(root, '.claude', 'praxis.json'))) return;
  try {
    const check = join(root, '.claude', 'praxis.check.json');
    if (existsSync(check)) {
      const at = JSON.parse(readFileSync(check, 'utf8')).at;
      if (at && Date.now() - Date.parse(at) < 24 * 3600 * 1000) return;
    }
    const child = spawn(process.execPath, [script, 'check'], { cwd: root, detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
  } catch { /* rede e best-effort */ }
}

/** Cobranca da memoria (ADR-0010): linha-resumo sempre; detalhe dos problemas no maximo 1x/dia. */
function memoryLines(root, mc, st) {
  if (!mc) return { lines: [], hasRules: false };
  let res;
  try { res = mc.checkMemory(root); } catch { return { lines: [], hasRules: false }; }
  const lines = [`- ${res.line}`];
  const hasRules = res.summary.total > 0 || res.summary.correcoesSemRegra > 0;
  if (res.problems.length) {
    const today = nowISO().slice(0, 10);
    const last = (st['Cobranca de memoria em'] || '').slice(0, 10);
    if (last !== today) {
      writeStateFields(root, { 'Cobranca de memoria em': nowISO() });
      const MAX = 6;
      for (const p of res.problems.slice(0, MAX)) lines.push(`  [${p.nivel}] ${p.arquivo}: ${p.msg}`);
      if (res.problems.length > MAX) lines.push(`  (+${res.problems.length - MAX} — node .claude/scripts/memory-check.mjs)`);
      lines.push('  Regra quebrada ou com fonte morta: derrube (remova o arquivo + registre na origem) ou corrija ANTES de seguir. Correcao sem regra: proponha converter, uma por vez (molde: docs/templates/rule-template.md).');
    } else {
      lines.push(`  (${res.summary.erros} erro(s), ${res.summary.avisos} aviso(s) ja cobrados hoje — node .claude/scripts/memory-check.mjs)`);
    }
  }
  return { lines, hasRules };
}

async function buildSessionContext(root) {
  const st = readStateFields(root);
  const ledger = readLedgerEvents(root);
  const mc = await loadMemoryCheck(root);

  const lines = [];
  lines.push('[Praxis · memoria do projeto — contexto de fundo injetado pelo hook reconcile]');

  const hasState = st['Ultimo checkpoint'] && st['Ultimo checkpoint'] !== '—';
  if (hasState) {
    lines.push('', `Ultima sessao (docs/project/state.md): checkpoint ${st['Ultimo checkpoint']}`
      + (st['Arquivos alterados no ultimo turno'] && st['Arquivos alterados no ultimo turno'] !== '—' ? ` · arquivos do ultimo turno: ${st['Arquivos alterados no ultimo turno']}` : ''));
  }

  const mem = memoryLines(root, mc, st);
  if (mem.lines.length) {
    lines.push('', 'Memoria (regras ativas em .claude/rules/learned/ carregam sozinhas ao tocar os arquivos do `paths`; learnings sao evidencia, abra so o que uma regra cita):');
    lines.push(...mem.lines);
  }

  if (ledger.length) {
    lines.push('', 'Atividade recente (ledger):');
    for (const l of ledger.slice(-4)) lines.push(`- ${l}`);
  }

  const update = catalogUpdateLine(root);

  if (!hasState && !mem.hasRules && !ledger.length) {
    // projeto novo / sem memoria: nao polui — uma linha so.
    return '[Praxis] Sem memoria de aprendizado registrada ainda neste projeto.' + (update ? `\n${update}` : '');
  }

  if (update) lines.push('', update);
  lines.push('', 'Obs.: contexto de fundo. As regras de saudacao do Praxis (Modalidade A/B/C) continuam valendo.');
  return lines.join('\n');
}

function maybeNag(root) {
  const events = readLedgerEvents(root);
  if (!events.length) return null;

  // indice da ultima entrada semantica (llm)
  let lastLlm = -1;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].includes('(llm)')) { lastLlm = i; break; }
  }
  // turnos (auto) apos a ultima (llm) que tocaram trabalho real (spec/codigo)
  const after = events.slice(lastLlm + 1);
  const lineHasWorkFile = (line) => {
    const m = line.match(/files:\s*(.+?)\s*\|/);
    if (!m) return false;
    return m[1].split(',').map((s) => s.trim()).some((p) => WORK_PATH_RE.test(p));
  };
  const workTurns = after.filter((l) => l.includes('| turn ') && l.includes('(auto)') && lineHasWorkFile(l));
  if (!workTurns.length) return null;

  // throttle: nao repetir nag em turnos consecutivos
  const st = readStateFields(root);
  if ((st['Nag emitido no turno anterior'] || 'nao').toLowerCase() === 'sim') {
    writeStateFields(root, { 'Nag emitido no turno anterior': 'nao' });
    return null;
  }
  writeStateFields(root, { 'Nag emitido no turno anterior': 'sim' });

  return [
    '[Praxis · captura de aprendizado]',
    'Houve alteracao em arquivos de spec/codigo desde o ultimo registro semantico no ledger.',
    'Se neste trabalho houve decisao, correcao do usuario ou descoberta, registre AGORA — no instante,',
    'nao no fim: correcao do usuario = regra ativa em .claude/rules/learned/ (molde docs/templates/rule-template.md)',
    '+ entrada de evidencia no learning do dominio (docs/project/learnings/) + uma linha (llm) no ledger.',
  ].join('\n');
}

async function main() {
  let input = {};
  try { input = parseInput(await readStdin()); } catch { /* ignore */ }
  const event = input.hook_event_name || '';
  const root = getRoot(input);

  if (event === 'SessionStart') {
    emitContext('SessionStart', await buildSessionContext(root));
    maybeSpawnCheck(root);
  } else if (event === 'UserPromptSubmit') {
    const nag = maybeNag(root);
    if (nag) emitContext('UserPromptSubmit', nag);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
