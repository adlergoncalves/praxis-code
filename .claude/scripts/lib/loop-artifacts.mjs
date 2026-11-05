// loop-artifacts.mjs — leitura e escrita deterministica dos artefatos do loop (ADR-0007).
//
// Usado pelo loop-driver, pelo loop-briefing e pelo slice-gates. O estado durável do loop e o
// tasks.md (trava T1): este modulo le dele o Preflight, o Loop Log, as fatias, os grupos e a tabela
// de Gates, e escreve nele so o que e do driver — a troca de status de uma fatia e a tabela
// "Custo por sessão (driver)". Agnostico de stack: nao conhece comando nenhum, so o formato.
//
// Formato lido aqui so muda em major (ADR-0009, invariante 5). Campo novo e opcional: tasks.md
// sem ele continua funcionando.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const STATUS = ['TODO', 'WIP', 'DONE', 'BLOCKED', 'ABANDONADA'];
const ID = 'U[0-9][0-9A-Za-z.]*';
const ROW_RE = new RegExp(`^\\|\\s*(${ID})\\s*\\|\\s*\`?(TODO|WIP|DONE|BLOCKED|ABANDONADA)\\b[^|]*\\|`);

export function read(path) {
  return readFileSync(path, 'utf8');
}

function eol(text) {
  return /\r\n/.test(text) ? '\r\n' : '\n';
}

/** Pasta da feature em docs/specs/ (nome exato ou trecho unico) com tasks.md. Lanca Error com a causa. */
export function resolveFeature(root, name) {
  const specs = join(root, 'docs', 'specs');
  if (!existsSync(specs)) throw new Error(`nao achei docs/specs/ em ${root} — rode da raiz do projeto`);
  if (existsSync(join(specs, name, 'tasks.md'))) return name;
  const hits = readdirSync(specs).filter((d) => d.includes(name) && existsSync(join(specs, d, 'tasks.md')));
  if (hits.length === 1) return hits[0];
  if (!hits.length) throw new Error(`nenhuma feature com tasks.md casa com "${name}" em docs/specs/`);
  throw new Error(`"${name}" casa com mais de uma feature: ${hits.join(', ')}`);
}

export function featurePaths(root, feature) {
  const dir = join(root, 'docs', 'specs', feature);
  return { dir, tasks: join(dir, 'tasks.md'), plan: join(dir, 'plan.md'), spec: join(dir, 'spec.md') };
}

/**
 * Secao de um markdown: da linha de cabecalho que casa `titleRe` ate o proximo cabecalho de nivel
 * igual ou maior. Devolve { start, end, lines } (end exclusivo) ou null.
 */
export function section(text, titleRe, { level } = {}) {
  const lines = text.split(/\r?\n/);
  let start = -1;
  let lvl = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (!m) continue;
    if ((level === undefined || m[1].length === level) && titleRe.test(m[2])) { start = i; lvl = m[1].length; break; }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s/);
    if (m && m[1].length <= lvl) { end = i; break; }
  }
  return { start, end, lines: lines.slice(start, end) };
}

export function sectionText(text, titleRe, opts) {
  const s = section(text, titleRe, opts);
  return s ? s.lines.join('\n').trimEnd() : null;
}

/** Valor de "| **Campo** | valor |" do Preflight, ou null quando vazio ("—"). */
export function preflightField(text, campo) {
  const m = text.match(new RegExp(`^\\|\\s*\\*\\*${campo}\\*\\*\\s*\\|\\s*([^|]*?)\\s*\\|`, 'm'));
  const v = m ? m[1].replace(/`/g, '').trim() : '';
  return !v || v === '—' || v === '-' ? null : v;
}

/** "feature/x, criada de main" -> "feature/x". */
export function preflightBranch(text) {
  const v = preflightField(text, 'Branch');
  return v ? v.split(/\s+/)[0].replace(/[,;.]+$/, '') : null;
}

/** Linhas do Loop Log: [{ id, status, raw }]. Le a secao "Estado durável"; sem ela, o arquivo inteiro. */
export function loopLog(text) {
  const s = section(text, /Estado dur[aá]vel|Loop Log/i, { level: 2 });
  const lines = s ? s.lines : text.split(/\r?\n/);
  const out = [];
  for (const raw of lines) {
    const m = raw.match(ROW_RE);
    if (m && !out.some((r) => r.id === m[1])) out.push({ id: m[1], status: m[2], raw });
  }
  return out;
}

export const isDone = (status) => status === 'DONE';

/**
 * Troca o status de uma fatia no Loop Log. `nota` (opcional) substitui a coluna Notas.
 * Devolve true se trocou. So mexe na primeira linha da fatia dentro da secao do Loop Log.
 */
export function setStatus(tasksPath, id, status, nota) {
  return editRow(tasksPath, id, status, nota);
}

/** Troca so a coluna Notas de uma fatia, mantendo o status como esta (inclusive "DONE (staged)"). */
export function setNote(tasksPath, id, nota) {
  return editRow(tasksPath, id, null, nota);
}

function editRow(tasksPath, id, status, nota) {
  const text = read(tasksPath);
  const nl = eol(text);
  const lines = text.split(/\r?\n/);
  const s = section(text, /Estado dur[aá]vel|Loop Log/i, { level: 2 });
  const [from, to] = s ? [s.start, s.end] : [0, lines.length];
  for (let i = from; i < to; i++) {
    const m = lines[i].match(ROW_RE);
    if (!m || m[1] !== id) continue;
    const cells = lines[i].split('|');
    // cells: ['', ' U1 ', ' `TODO` ', ' data ', ' commit ', ' notas ', '']
    if (status) cells[2] = ` \`${status}\` `;
    if (nota !== undefined && cells.length >= 7) cells[cells.length - 2] = ` ${nota.replace(/\|/g, '/')} `;
    lines[i] = cells.join('|');
    writeFileSync(tasksPath, lines.join(nl), 'utf8');
    return true;
  }
  return false;
}

/**
 * Fatias do backlog: cabecalhos "### U«n» — titulo". Devolve [{ id, title, text, deps, model, effort }].
 * `model`/`effort` vem da linha "**Modelo · esforço:** opus · high — motivo" (opcional).
 */
export function slices(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  const head = new RegExp(`^###\\s+(${ID})\\b\\s*[—–-]?\\s*(.*)$`);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(head);
    if (!m) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) if (/^#{1,3}\s/.test(lines[j])) { end = j; break; }
    const body = lines.slice(i, end).join('\n').trimEnd();
    const dep = body.match(/\*\*Depende de:?\*\*:?\s*([^\n]*)/i);
    const deps = dep ? [...dep[1].matchAll(new RegExp(ID, 'g'))].map((x) => x[0]).filter((d) => d !== m[1]) : [];
    const me = body.match(/\*\*Modelo\s*[·.]\s*esfor[cç]o:?\*\*:?\s*`?([A-Za-z0-9.[\]_-]+)`?\s*[·.]\s*`?(low|medium|high|xhigh|max)\b/i);
    out.push({ id: m[1], title: m[2].trim(), text: body, deps, model: me ? me[1].toLowerCase() : null, effort: me ? me[2].toLowerCase() : null });
  }
  return out;
}

/** Grupos paralelizaveis: Map("G1" -> ["U0","U1"]) da tabela "| G1 | U0, U1 | ... |". */
export function groups(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\|\s*(G\d+)\s*\|\s*([^|]+)\|/);
    if (m) map.set(m[1], [...m[2].matchAll(new RegExp(ID, 'g'))].map((x) => x[0]));
  }
  return map;
}

/** Grupos liberados no Preflight ("multi-agente nos grupos G1, G2"); vazio no modo sequencial. */
export function liberatedGroups(text) {
  const modo = preflightField(text, 'Modo de execu[cç][aã]o') || '';
  if (!/multi/i.test(modo)) return [];
  return [...modo.matchAll(/G\d+/g)].map((x) => x[0]);
}

/**
 * Tabela de Gates: [{ camada, caminhos, comandos }]. `caminhos`: '*' (sempre), null (o runner nao
 * roda: e2e que depende do app de pe, conformidade) ou lista de globs. Sem a coluna Caminhos
 * (tasks.md anterior a ela), toda linha com comando roda sempre. `comandos`: o que esta entre
 * crases na coluna Comandos, sem as skills (`/x`).
 */
export function gates(text) {
  const s = section(text, /^Gates\b/i, { level: 2 });
  if (!s) return [];
  const rows = s.lines.filter((l) => l.trim().startsWith('|'));
  if (rows.length < 2) return [];
  const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const header = cells(rows[0]);
  const iCamada = Math.max(0, header.findIndex((h) => /camada/i.test(h)));
  const iCaminhos = header.findIndex((h) => /caminho/i.test(h));
  let iComandos = header.findIndex((h) => /comando/i.test(h));
  if (iComandos === -1) iComandos = header.length - 1;
  const out = [];
  for (const row of rows.slice(1)) {
    if (/^\|\s*:?-{2,}/.test(row.trim())) continue;
    const c = cells(row);
    const comandos = [...(c[iComandos] || '').matchAll(/`([^`]+)`/g)].map((x) => x[1].trim()).filter((x) => x && !x.startsWith('/') && !x.startsWith('@') && !x.startsWith('{'));
    let caminhos = '*';
    if (iCaminhos !== -1) {
      const v = (c[iCaminhos] || '').replace(/`/g, '').trim();
      if (!v || v === '—' || v === '-') caminhos = null;
      else if (v === '*') caminhos = '*';
      else caminhos = v.split(/[,\s]+/).filter(Boolean);
    }
    out.push({ camada: (c[iCamada] || '').replace(/\*\*/g, ''), caminhos, comandos });
  }
  return out;
}

/** Glob simples -> RegExp: `**` qualquer coisa, `*` dentro de um segmento, `?` um caractere; sem curinga = prefixo. */
export function globToRegex(glob) {
  let g = glob.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!/[*?]/.test(g)) g = g.replace(/\/$/, '') + '/**';
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const ch = g[i];
    if (ch === '*' && g[i + 1] === '*') { re += '.*'; i++; if (g[i + 1] === '/') i++; }
    else if (ch === '*') re += '[^/]*';
    else if (ch === '?') re += '[^/]';
    else re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(file, globs) {
  return globs.some((g) => globToRegex(g).test(file) || g === file);
}

// --- git -------------------------------------------------------------------------------------------

export function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

export function currentBranch(root) {
  const r = git(root, ['symbolic-ref', '--short', '-q', 'HEAD']);
  return r.ok ? r.out : '(HEAD destacado)';
}

/**
 * Foto do estado atual como base de diff, sem mexer na arvore: o commit do `git stash create`
 * (arvore de trabalho + index) ou o HEAD quando nada mudou. Assim o diff de uma fatia nao inclui o
 * que a anterior deixou staged (politica de commit `staged`).
 */
export function snapshot(root) {
  const s = git(root, ['stash', 'create']);
  if (s.ok && /^[0-9a-f]{40}$/.test(s.out)) return s.out;
  const h = git(root, ['rev-parse', 'HEAD']);
  if (!h.ok) throw new Error('repositorio sem commit — o loop precisa de um HEAD para medir o diff');
  return h.out;
}

/** Arquivos alterados desde `base` (commitados, staged, na arvore e nao rastreados), em formato posix. */
export function changedFiles(root, base) {
  const diff = git(root, ['diff', '--name-only', base]).out.split(/\r?\n/);
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard']).out.split(/\r?\n/);
  return [...new Set([...diff, ...untracked].map((f) => f.trim().replace(/\\/g, '/')).filter(Boolean))].sort();
}

export function changedSince(root, base) {
  return changedFiles(root, base).length > 0;
}

// --- tabela do driver --------------------------------------------------------------------------------

const COST_TITLE = '### Custo por sessão (driver)';
const COST_HEAD = ['| Quando | Fatia | Papel | Modelo | Custo US$ | Pico de contexto | Turnos | Resultado |', '|---|---|---|---|---|---|---|---|'];

/** Acrescenta uma linha na tabela "Custo por sessão (driver)", criando-a no fim da secao do Loop Log. */
export function appendCostRow(tasksPath, cells) {
  const text = read(tasksPath);
  const nl = eol(text);
  const lines = text.split(/\r?\n/);
  const row = `| ${cells.map((c) => String(c ?? '?').replace(/\|/g, '/')).join(' | ')} |`;
  const at = lines.findIndex((l) => l.trim() === COST_TITLE);
  if (at !== -1) {
    let j = at + 1;
    while (j < lines.length && !lines[j].trim().startsWith('|')) j++;
    while (j < lines.length && lines[j].trim().startsWith('|')) j++;
    lines.splice(j, 0, row);
  } else {
    const s = section(text, /Estado dur[aá]vel|Loop Log/i, { level: 2 });
    let end = s ? s.end : lines.length;
    while (end > 0 && !lines[end - 1].trim()) end--;
    lines.splice(end, 0, '', COST_TITLE, '',
      '> Escrita pelo `loop-driver.mjs`, uma linha por sessão (fatia, continuação ou verificador). Custo pelo preço de tabela da API: estimativa para comparar, não fatura.',
      '', ...COST_HEAD, row);
  }
  writeFileSync(tasksPath, lines.join(nl), 'utf8');
}

/** Modo do projeto no manifesto ("**Modo**: lite"); null quando nao declarado. */
export function projectMode(root) {
  const p = join(root, 'docs', 'project', 'manifest.md');
  if (!existsSync(p)) return null;
  const m = read(p).match(/^\*\*Modo\*\*:\s*`?(lite|full)\b/im);
  return m ? m[1].toLowerCase() : null;
}
