#!/usr/bin/env node
// reconcile.mjs — hook de USO da memoria de aprendizado (kit Praxis).
//
// Eventos:
//   SessionStart     -> injeta estado reconciliado da ultima sessao + correcoes em vigor
//                       + descobertas pendentes (additionalContext de fundo).
//   UserPromptSubmit -> nag discreto se houve trabalho de spec/codigo sem registro semantico
//                       no ledger desde a ultima entrada (llm). Com throttle. Exit 0 SEMPRE
//                       (jamais exit 2 — apagaria o prompt do usuario).
//
// Saida: JSON { hookSpecificOutput: { hookEventName, additionalContext } } via stdout, exit 0.
// Falha graciosa: qualquer erro -> exit 0 sem output (a instrucao e a fonte primaria).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import {
  readStdin, parseInput, getRoot, nowISO,
  readStateFields, writeStateFields, readLedgerEvents, parseLearnings,
  WORK_PATH_RE, emitContext,
} from './_lib.mjs';

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

function buildSessionContext(root) {
  const st = readStateFields(root);
  const { corrections, pending } = parseLearnings(root);
  const ledger = readLedgerEvents(root);

  const lines = [];
  lines.push('[Praxis · memoria de aprendizado — contexto de fundo injetado pelo hook reconcile]');

  const hasState = st['Ultimo checkpoint'] && st['Ultimo checkpoint'] !== '—';
  if (hasState) {
    lines.push('', 'Estado da ultima sessao (docs/project/state.md):');
    if (st['Fase atual']) lines.push(`- Fase: ${st['Fase atual']}`);
    if (st['Ultima acao (skill / resultado)']) lines.push(`- Ultima acao: ${st['Ultima acao (skill / resultado)']}`);
    if (st['Arquivos alterados no ultimo turno'] && st['Arquivos alterados no ultimo turno'] !== '—')
      lines.push(`- Arquivos do ultimo turno: ${st['Arquivos alterados no ultimo turno']}`);
    if (st['Proximo passo sugerido']) lines.push(`- Proximo passo sugerido: ${st['Proximo passo sugerido']}`);
  }

  if (corrections.length) {
    lines.push('', 'Correcoes do usuario EM VIGOR (peso maximo — respeite SEMPRE, em toda implementacao):');
    for (const c of corrections.slice(0, 12)) lines.push(`- [${c.domain}] ${c.rule}`);
    if (corrections.length > 12) lines.push(`- (+${corrections.length - 12} outras — ver docs/project/learnings/)`);
  }

  if (pending.length) {
    lines.push('', 'Descobertas pendentes (status: pendente — avaliar/aplicar):');
    for (const d of pending.slice(0, 8)) lines.push(`- [${d.domain}] ${d.desc}${d.action ? ` — acao: ${d.action}` : ''}`);
    if (pending.length > 8) lines.push(`- (+${pending.length - 8} outras)`);
  }

  if (ledger.length) {
    lines.push('', 'Atividade recente (ledger):');
    for (const l of ledger.slice(-4)) lines.push(`- ${l}`);
  }

  const update = catalogUpdateLine(root);

  if (!hasState && !corrections.length && !pending.length && !ledger.length) {
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
    'nao no fim: o arquivo de learning do dominio (docs/project/learnings/) + uma linha (llm) no ledger.',
  ].join('\n');
}

async function main() {
  let input = {};
  try { input = parseInput(await readStdin()); } catch { /* ignore */ }
  const event = input.hook_event_name || '';
  const root = getRoot(input);

  if (event === 'SessionStart') {
    emitContext('SessionStart', buildSessionContext(root));
    maybeSpawnCheck(root);
  } else if (event === 'UserPromptSubmit') {
    const nag = maybeNag(root);
    if (nag) emitContext('UserPromptSubmit', nag);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
