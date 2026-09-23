// _lib.mjs — helpers compartilhados pelos hooks de aprendizado do kit Praxis.
// Co-localizado em .claude/hooks/; reconcile.mjs e capture.mjs importam via "./_lib.mjs".
// Sem dependencias externas (apenas built-ins do Node). Tudo aqui falha graciosamente:
// quem chama deve envolver em try/catch e sair com exit 0 mesmo em erro — a instrucao
// (CLAUDE.md / agents) e a fonte primaria de captura; os hooks sao redes redundantes.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// --- stdin / input ---------------------------------------------------------

export async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export function parseInput(raw) {
  const s = String(raw);
  try { return JSON.parse(s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s); } catch { return {}; }
}

export function getRoot(input) {
  return process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
}

// --- paths -----------------------------------------------------------------

export const ledgerPath    = (root) => join(root, 'docs', 'project', 'learnings', 'ledger.md');
export const ledgerArchive = (root) => join(root, 'docs', 'project', 'learnings', 'ledger-archive');
export const statePath     = (root) => join(root, 'docs', 'project', 'state.md');
export const learningsDir   = (root) => join(root, 'docs', 'project', 'learnings');

export const LEARNING_FILES = [
  ['frontend-learnings.md',     'frontend'],
  ['backend-learnings.md',      'backend'],
  ['business-learnings.md',     'business'],
  ['architecture-learnings.md', 'architecture'],
  ['process-learnings.md',      'process'],
];

// Paths que contam como "trabalho real" (spec/codigo), p/ a heuristica do nag.
export const WORK_PATH_RE = /(^|[\\/])(specs|src|app|lib|components|pages|api)[\\/]|\.(ts|tsx|js|jsx|py|cs|java|go|rb|php|sql|vue|svelte)$/i;

// --- tempo -----------------------------------------------------------------

export function nowISO() {
  return new Date().toISOString().slice(0, 16) + 'Z'; // 2026-05-27T14:03Z
}

// --- ledger ----------------------------------------------------------------

const LEDGER_MARK = '<!-- LEDGER:START -->';

export function readLedgerEvents(root) {
  const p = ledgerPath(root);
  if (!existsSync(p)) return [];
  const txt = readFileSync(p, 'utf8');
  const idx = txt.indexOf(LEDGER_MARK);
  const body = idx === -1 ? txt : txt.slice(idx + LEDGER_MARK.length);
  return body.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && l.includes(' | '));
}

// Self-heal: garante que o ledger exista (cliente pode nao ter o seed). Sem isso, a captura
// faria no-op silencioso e a Fase 2 nao funcionaria no projeto cliente.
export function ensureLedger(root) {
  const p = ledgerPath(root);
  if (existsSync(p)) return;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `# Ledger de Aprendizado (caixa-preta append-only)\n\n> Gravado no instante; nao editar manualmente abaixo da marca.\n\n${LEDGER_MARK}\n`, 'utf8');
}

export function appendLedger(root, line) {
  ensureLedger(root);
  const p = ledgerPath(root);
  let txt = readFileSync(p, 'utf8');
  if (!txt.includes(LEDGER_MARK)) txt += `\n${LEDGER_MARK}\n`;
  txt = txt.replace(/\s*$/, '') + '\n' + line + '\n';
  writeFileSync(p, txt, 'utf8');
  rotateLedgerIfNeeded(root);
}

function rotateLedgerIfNeeded(root, limit = 500) {
  const events = readLedgerEvents(root);
  if (events.length <= limit) return;
  try {
    const dir = ledgerArchive(root);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const month = new Date().toISOString().slice(0, 7); // AAAA-MM
    const archive = join(dir, `${month}.md`);
    const keep = Math.floor(limit / 2);
    const moved = events.slice(0, events.length - keep);
    const remaining = events.slice(events.length - keep);
    const header = existsSync(archive) ? readFileSync(archive, 'utf8') : `# Ledger arquivado — ${month}\n\n`;
    writeFileSync(archive, header + moved.join('\n') + '\n', 'utf8');
    const p = ledgerPath(root);
    const txt = readFileSync(p, 'utf8');
    const head = txt.slice(0, txt.indexOf(LEDGER_MARK) + LEDGER_MARK.length);
    writeFileSync(p, `${head}\n<!-- rotacionado em ${nowISO()}: ${moved.length} linhas -> ledger-archive/${month}.md -->\n${remaining.join('\n')}\n`, 'utf8');
  } catch { /* rotacao e best-effort */ }
}

// --- state.md (bloco STATE) -------------------------------------------------

const STATE_START = '<!-- STATE:START -->';
const STATE_END   = '<!-- STATE:END -->';

export function readStateFields(root) {
  const p = statePath(root);
  if (!existsSync(p)) return {};
  const txt = readFileSync(p, 'utf8');
  const a = txt.indexOf(STATE_START), b = txt.indexOf(STATE_END);
  if (a === -1 || b === -1) return {};
  const block = txt.slice(a + STATE_START.length, b);
  const fields = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^\*\*(.+?)\*\*:\s*(.*)$/);
    if (m) fields[m[1].trim()] = m[2].trim();
  }
  return fields;
}

// Self-heal: garante que o state.md exista com o bloco STATE (cliente pode nao ter o seed).
export function ensureState(root) {
  const p = statePath(root);
  if (existsSync(p)) return;
  mkdirSync(dirname(p), { recursive: true });
  const seed = `# Estado do Projeto (snapshot de handoff)\n\n> Reescrito automaticamente pelo hook capture.mjs. Snapshot efemero (gitignored no cliente).\n\n${STATE_START}\n**Ultimo checkpoint**: —\n**Evento**: —\n**Fase atual**: —\n**Ultima acao (skill / resultado)**: — / —\n**Arquivos alterados no ultimo turno**: —\n**Learnings pendentes**: —\n**Proximo passo sugerido**: —\n**Nag emitido no turno anterior**: nao\n${STATE_END}\n`;
  writeFileSync(p, seed, 'utf8');
}

// Atualiza campos do bloco STATE preservando os demais e a ordem existente.
export function writeStateFields(root, updates) {
  ensureState(root);
  const p = statePath(root);
  const txt = readFileSync(p, 'utf8');
  const a = txt.indexOf(STATE_START), b = txt.indexOf(STATE_END);
  if (a === -1 || b === -1) return;
  const before = txt.slice(0, a + STATE_START.length);
  const after = txt.slice(b);
  const block = txt.slice(a + STATE_START.length, b);
  const lines = block.split(/\r?\n/);
  const seen = new Set();
  const out = lines.map((line) => {
    const m = line.match(/^\*\*(.+?)\*\*:\s*(.*)$/);
    if (!m) return line;
    const key = m[1].trim();
    if (key in updates) { seen.add(key); return `**${key}**: ${updates[key]}`; }
    return line;
  });
  // adiciona campos novos (que nao existiam) antes do END
  for (const [key, val] of Object.entries(updates)) {
    if (!seen.has(key)) out.splice(out.length - 1, 0, `**${key}**: ${val}`);
  }
  writeFileSync(p, before + out.join('\n') + after, 'utf8');
}

// --- learnings (parse defensivo) -------------------------------------------

function field(entry, name) {
  const re = new RegExp(`\\*\\*${name}\\*\\*:\\s*(.+)`, 'i');
  const m = entry.match(re);
  return m ? m[1].trim() : null;
}

const truncate = (s, n = 160) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);

// Retorna { corrections: [{domain, rule}], pending: [{domain, desc, action}], pendingCount }.
export function parseLearnings(root) {
  const corrections = [];
  const pending = [];
  for (const [file, domain] of LEARNING_FILES) {
    const p = join(learningsDir(root), file);
    if (!existsSync(p)) continue;
    let txt;
    try { txt = readFileSync(p, 'utf8'); } catch { continue; }
    txt = txt.replace(/<!--[\s\S]*?-->/g, ''); // remove templates/comentarios HTML (nao sao entradas reais)
    const parts = txt.split(/\n###\s+/).slice(1); // ignora preambulo
    for (const part of parts) {
      const header = part.split(/\r?\n/)[0] || '';
      if (/\[CORRECAO DO USUARIO\]/i.test(header)) {
        const rule = field(part, 'Regra derivada') || field(part, 'Correcao aplicada');
        if (rule) corrections.push({ domain, rule: truncate(rule) });
      } else {
        const status = field(part, 'Status');
        if (status && /pendente/i.test(status)) {
          const desc = field(part, 'Descoberta');
          const action = field(part, 'Acao sugerida');
          if (desc) pending.push({ domain, desc: truncate(desc), action: truncate(action, 80) });
        }
      }
    }
  }
  return { corrections, pending, pendingCount: pending.length };
}

// --- saida de hook (JSON additionalContext) ---------------------------------

export function emitContext(eventName, text) {
  if (!text || !text.trim()) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: eventName, additionalContext: text },
  }));
}
