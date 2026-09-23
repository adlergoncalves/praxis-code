#!/usr/bin/env node
// capture.mjs — hook de CAPTURA (caixa-preta) da memoria de aprendizado (kit Praxis).
//
// Eventos:
//   Stop / SubagentStop  -> grava 1 linha (auto) no ledger com os arquivos alterados no turno
//                           + atualiza o snapshot docs/project/state.md. Roda em background
//                           (async no settings) — nao trava o turno.
//   PreCompact / SessionEnd -> mesmo checkpoint (redundancia). Sincrono, exit 0 (PreCompact NAO
//                           pode sair com 2, senao bloquearia a compactacao).
//
// Efeito apenas em disco — o stdout do Stop nao vira contexto do proximo turno (confirmado na doc).
// Falha graciosa: qualquer erro -> exit 0.
//
// Deteccao de arquivos alterados: le o transcript JSONL via cursor por sessao (sidecar
// .claude/hooks/.capture-cursor.json), processando so as linhas novas desde o ultimo checkpoint.
// Este repo (e muitos clientes) podem nao ser git — por isso usamos o transcript, nao git diff.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readStdin, parseInput, getRoot, nowISO,
  appendLedger, writeStateFields, parseLearnings, WORK_PATH_RE,
} from './_lib.mjs';

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const cursorFile = () => join(dirname(fileURLToPath(import.meta.url)), '.capture-cursor.json');

function readCursors() {
  try { return JSON.parse(readFileSync(cursorFile(), 'utf8')); } catch { return {}; }
}
function writeCursors(c) {
  try { writeFileSync(cursorFile(), JSON.stringify(c), 'utf8'); } catch { /* best-effort */ }
}

// Coleta file_path de tool_use de escrita em um objeto de linha do transcript.
function collectPaths(obj, out, root) {
  const content = obj?.message?.content;
  const arr = Array.isArray(content) ? content : [];
  for (const block of arr) {
    if (block?.type === 'tool_use' && WRITE_TOOLS.has(block.name)) {
      const fp = block.input?.file_path || block.input?.notebook_path;
      const r = fp ? rel(fp, root) : null;
      if (r) out.add(r);
    }
  }
}

// Caminho relativo ao projeto, ou null se o arquivo estiver fora dele. Arquivos fora do projeto
// nunca vao para o ledger (que e versionado): caminhos absolutos expoem usuario/estrutura da maquina.
function rel(p, root) {
  const norm = String(p).replace(/\\/g, '/');
  const r = String(root).replace(/\\/g, '/').replace(/\/$/, '');
  const isAbsolute = /^([A-Za-z]:)?\//.test(norm);
  if (!isAbsolute) return norm.includes('..') ? null : norm.replace(/^\.\//, '');
  const cmp = (s) => (/^[A-Za-z]:/.test(s) ? s.toLowerCase() : s);
  if (!cmp(norm).startsWith(cmp(r) + '/')) return null;
  return norm.slice(r.length + 1);
}

function changedFilesThisTurn(input, root) {
  const tp = input.transcript_path;
  if (!tp || !existsSync(tp)) return [];
  let lines;
  try { lines = readFileSync(tp, 'utf8').split(/\r?\n/).filter(Boolean); } catch { return []; }

  const sid = input.session_id || tp;
  const cursors = readCursors();
  const prev = Number(cursors[sid]) || 0;
  const fresh = lines.slice(prev);
  cursors[sid] = lines.length;
  writeCursors(cursors);

  const paths = new Set();
  for (const line of fresh) {
    let obj; try { obj = JSON.parse(line); } catch { continue; }
    collectPaths(obj, paths, root);
  }
  // ignora os proprios arquivos de memoria (evita auto-ruido)
  return [...paths].filter((p) => !/learnings\/(ledger|.*-learnings)|project\/state\.md/.test(p));
}

function snapshot(root, event, files) {
  const { pendingCount } = parseLearnings(root);
  writeStateFields(root, {
    'Ultimo checkpoint': nowISO(),
    'Evento': event,
    'Arquivos alterados no ultimo turno': files.length ? files.join(', ') : '—',
    'Learnings pendentes': String(pendingCount),
  });
}

async function main() {
  let input = {};
  try { input = parseInput(await readStdin()); } catch { /* ignore */ }
  const event = input.hook_event_name || 'Stop';
  const root = getRoot(input);

  const files = changedFilesThisTurn(input, root);

  // linha (auto) no ledger so quando houve alteracao de arquivo (evita inflar com turnos vazios)
  if (files.length) {
    appendLedger(root, `${nowISO()} | turn | files: ${files.join(', ')} | (auto)`);
  }
  snapshot(root, event, files);
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
