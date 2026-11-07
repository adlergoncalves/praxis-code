#!/usr/bin/env node
// memory-check.mjs — cobranca DETERMINISTICA da memoria do projeto (ADR-0010).
//
// A regra ativa vive em .claude/rules/learned/<dominio>-<slug>.md (molde: docs/templates/rule-template.md)
// e o Claude Code a carrega sozinho — em toda sessao quando nao tem `paths`, ou quando um arquivo que
// casa com `paths` e lido/escrito/editado. O que o Claude Code NAO faz e avisar quando uma regra esta
// quebrada, vencida ou apontando para codigo que nao existe mais. Este script faz isso, por exit code.
//
// Checagens (por regra em learned/):
//   ERRO   frontmatter ausente/sem fechamento, `paths` ilegivel (o Claude Code ignora o frontmatter e a
//          regra passa a carregar em TODA sessao, em silencio); campo obrigatorio ausente ou invalido
//          (dominio, medido_em, derruba_com, vale_enquanto, check, origem); corpo sem `**Regra**`;
//          corpo com mais de 8 linhas; `**Fonte**` apontando para arquivo ou linha que nao existe.
//   AVISO  medido_em vencido (PRAXIS_RULE_MAX_DIAS, padrao 90); nome do arquivo sem o prefixo do dominio;
//          `check` apontando para script/agent inexistente; `origem` apontando para arquivo/entrada ausente.
// Checagens da pasta (.claude/rules/** inteira — tudo ali carrega):
//   AVISO  regras sem `paths` acima do orcamento (PRAXIS_RULES_SEMPRE_MAX, padrao 10) ou somando mais de
//          120 linhas sempre carregadas.
// Migracao (docs/project/learnings/*-learnings.md):
//   AVISO  [CORRECAO DO USUARIO] sem regra ativa cuja `origem` aponte para ela (arquivo#data).
//
// Uso:  node .claude/scripts/memory-check.mjs [--json] [--quiet] [--root <raiz>] [--self-test]
// Exit: 0 ok (ou so AVISO) · 1 ERRO · 2 erro do proprio script
//
// Quem chama: reconcile.mjs (SessionStart — uma linha; problemas no maximo 1x/dia), fechamento do
// /execute, /verify-all e o validate-kit do repositorio do kit (--self-test).

import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const DOMINIOS = ['frontend', 'backend', 'business', 'architecture', 'process'];
const CAMPOS = ['dominio', 'medido_em', 'derruba_com', 'vale_enquanto', 'check', 'origem'];
const MAX_LINHAS_CORPO = 8;
const MAX_LINHAS_SEMPRE = 120;

const posix = (p) => String(p).split('\\').join('/');
const toRel = (root, abs) => posix(relative(root, abs));

// --- frontmatter --------------------------------------------------------------------------------------

/** Parse minimo do frontmatter YAML das regras: `chave: valor`, lista inline [..] ou `- item`. */
export function parseRuleFile(txt) {
  const s = txt.charCodeAt(0) === 0xFEFF ? txt.slice(1) : txt;
  if (!/^---\r?\n/.test(s)) return { ok: false, erro: 'sem frontmatter (---)', fm: null, body: s };
  const end = s.search(/\r?\n---[ \t]*(\r?\n|$)/);
  if (end === -1) return { ok: false, erro: 'frontmatter sem fechamento (---)', fm: null, body: '' };
  const head = s.slice(s.indexOf('\n') + 1, end);
  const body = s.slice(end).replace(/^\r?\n---[ \t]*(\r?\n)?/, '');
  const fm = {};
  let listKey = null;
  for (const raw of head.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (listKey && item) { fm[listKey].push(unquote(item[1])); continue; }
    const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) return { ok: false, erro: `linha ilegivel no frontmatter: "${raw.trim()}"`, fm: null, body };
    const [, key, value] = kv;
    listKey = null;
    if (value === '') { fm[key] = []; listKey = key; continue; }
    if (value.startsWith('[')) {
      const list = parseInlineList(value);
      if (!list) return { ok: false, erro: `lista ilegivel em "${key}"`, fm: null, body };
      fm[key] = list;
    } else fm[key] = unquote(value);
  }
  return { ok: true, erro: null, fm, body };
}

function unquote(v) {
  v = String(v).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

function parseInlineList(v) {
  const m = v.match(/^\[(.*)\]\s*$/);
  if (!m) return null;
  if (!m[1].trim()) return [];
  const out = [];
  for (const part of m[1].split(',')) {
    const t = unquote(part);
    if (!t) return null;
    out.push(t);
  }
  return out;
}

// --- leitura das regras --------------------------------------------------------------------------------

function walkMd(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(full));
    else if (e.name.endsWith('.md')) out.push(full);
  }
  return out.sort();
}

function bodyLines(body) {
  return body.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function parseFontes(lines) {
  const l = lines.find((x) => /^\*\*Fonte\*\*\s*:/i.test(x));
  if (!l) return { declarada: false, fontes: [] };
  const v = l.replace(/^\*\*Fonte\*\*\s*:\s*/i, '').trim();
  if (!v || v === '—' || v === '-' || /^n(ao|ão) h(a|á)/i.test(v)) return { declarada: true, fontes: [] };
  const fontes = v.split(',').map((s) => s.trim().replace(/^`|`$/g, '')).filter(Boolean).map((s) => {
    const m = s.match(/^(.+?):(\d+)(?:-\d+)?$/);
    return m ? { path: m[1], line: Number(m[2]) } : { path: s, line: null };
  });
  return { declarada: true, fontes };
}

function fileLineCount(abs) {
  const txt = readFileSync(abs, 'utf8');
  if (!txt) return 0;
  return txt.split(/\r?\n/).length - (txt.endsWith('\n') ? 1 : 0);
}

function checkExists(root, path) {
  const abs = join(root, path);
  return existsSync(abs) ? abs : null;
}

function checkTarget(root, check) {
  if (!check || check === 'manual') return true;
  const name = check.split(':')[0].trim();
  if (/[\\/]/.test(name) || /\.(mjs|js|sh|ps1|py)$/i.test(name)) return !!checkExists(root, name) || !!checkExists(root, join('.claude', 'scripts', name));
  if (/^check-[\w-]+$/.test(name)) {
    const agents = join(root, '.claude', 'agents');
    return walkMd(agents).some((f) => basename(f) === `${name}.md`);
  }
  return true; // nome livre (gate declarado no tasks.md, lint do projeto): nao ha como conferir aqui
}

// --- learnings (evidencia): correcoes e pendencias --------------------------------------------------------

export function scanLearnings(root) {
  const correcoes = []; // { file, date, header }
  let pendentes = 0;
  for (const d of DOMINIOS) {
    const file = `docs/project/learnings/${d}-learnings.md`;
    const abs = join(root, file);
    if (!existsSync(abs)) continue;
    let txt;
    try { txt = readFileSync(abs, 'utf8'); } catch { continue; }
    txt = txt.replace(/<!--[\s\S]*?-->/g, '');
    for (const part of txt.split(/\n###\s+/).slice(1)) {
      const header = part.split(/\r?\n/)[0] || '';
      if (/\[CORRECAO DO USUARIO\]/i.test(header)) {
        const date = (header.match(/\d{4}-\d{2}-\d{2}/) || [null])[0];
        correcoes.push({ file, date, header: header.trim() });
      } else if (/\*\*Status\*\*:\s*pendente/i.test(part)) pendentes++;
    }
  }
  return { correcoes, pendentes };
}

// --- checagem principal -----------------------------------------------------------------------------------

/**
 * Confere a memoria do projeto. Retorna { rules, problems, summary, line }.
 * problems: [{ nivel: 'ERRO'|'AVISO', arquivo, msg }]
 */
export function checkMemory(root, opts = {}) {
  const maxDias = Number(opts.maxDias ?? process.env.PRAXIS_RULE_MAX_DIAS ?? 90);
  const sempreMax = Number(opts.sempreMax ?? process.env.PRAXIS_RULES_SEMPRE_MAX ?? 10);
  const now = opts.now ? new Date(opts.now) : new Date();
  const problems = [];
  const add = (nivel, arquivo, msg) => problems.push({ nivel, arquivo, msg });

  const rulesDir = join(root, '.claude', 'rules');
  const learnedDir = join(rulesDir, 'learned');
  const rules = [];
  let sempre = 0, comPaths = 0, linhasSempre = 0;

  for (const abs of walkMd(rulesDir)) {
    const rel = toRel(root, abs);
    const learned = abs.startsWith(learnedDir);
    let txt;
    try { txt = readFileSync(abs, 'utf8'); } catch { add('ERRO', rel, 'nao foi possivel ler'); continue; }
    const parsed = parseRuleFile(txt);
    const lines = bodyLines(parsed.ok ? parsed.body : txt);
    const hasPaths = parsed.ok && Array.isArray(parsed.fm.paths) ? parsed.fm.paths.length > 0
      : parsed.ok && typeof parsed.fm.paths === 'string' ? parsed.fm.paths.trim().length > 0 : false;
    const rule = { arquivo: rel, learned, paths: hasPaths ? parsed.fm.paths : null, fm: parsed.fm, linhas: lines.length };
    rules.push(rule);
    if (hasPaths) comPaths++; else { sempre++; linhasSempre += lines.length; }

    if (!learned) continue; // regra do proprio usuario: so conta no orcamento

    if (!parsed.ok) { add('ERRO', rel, `${parsed.erro} — o Claude Code ignora o frontmatter e a regra carrega em TODA sessao`); continue; }
    const fm = parsed.fm;
    if ('paths' in fm && !hasPaths) add('ERRO', rel, '`paths` vazio ou ilegivel — a regra carrega em toda sessao; declare os globs ou remova o campo de proposito');
    for (const c of CAMPOS) if (!fm[c] || (typeof fm[c] === 'string' && !fm[c].trim())) add('ERRO', rel, `campo obrigatorio ausente: ${c}`);
    if (fm.dominio && !DOMINIOS.includes(fm.dominio)) add('ERRO', rel, `dominio invalido: ${fm.dominio} (${DOMINIOS.join(' | ')})`);
    if (fm.dominio && DOMINIOS.includes(fm.dominio) && !basename(rel).startsWith(`${fm.dominio}-`)) add('AVISO', rel, `nome sem o prefixo do dominio (${fm.dominio}-...)`);
    if (fm.medido_em) {
      const t = /^\d{4}-\d{2}-\d{2}$/.test(fm.medido_em) ? Date.parse(`${fm.medido_em}T00:00:00Z`) : NaN;
      if (Number.isNaN(t)) add('ERRO', rel, `medido_em invalido: ${fm.medido_em} (AAAA-MM-DD)`);
      else {
        const dias = Math.floor((now.getTime() - t) / 86400000);
        rule.dias = dias;
        if (dias > maxDias) add('AVISO', rel, `medido_em vencido ha ${dias - maxDias} dia(s) (limite ${maxDias}) — revalide: ${fm.derruba_com || '?'} · vale enquanto: ${fm.vale_enquanto || '?'}`);
      }
    }
    if (!lines.some((l) => /^\*\*Regra\*\*\s*:/i.test(l))) add('ERRO', rel, 'corpo sem `**Regra**:`');
    if (lines.length > MAX_LINHAS_CORPO) add('ERRO', rel, `corpo com ${lines.length} linhas (maximo ${MAX_LINHAS_CORPO}) — regra e instrucao curta, nao narrativa`);
    const { fontes } = parseFontes(lines);
    for (const f of fontes) {
      const abs2 = checkExists(root, f.path);
      if (!abs2 || !statSync(abs2).isFile()) { add('ERRO', rel, `Fonte morta — ${f.path} nao existe`); continue; }
      if (f.line !== null) {
        const n = fileLineCount(abs2);
        if (n < f.line) add('ERRO', rel, `Fonte morta — ${f.path}:${f.line} (arquivo tem ${n} linha(s))`);
      }
    }
    if (fm.check && !checkTarget(root, fm.check)) add('AVISO', rel, `check "${fm.check}" nao encontrado (script ou agent)`);
    if (fm.origem) {
      const [oPath, anchor] = String(fm.origem).split('#');
      const oAbs = checkExists(root, oPath);
      if (!oAbs) add('AVISO', rel, `origem nao existe: ${oPath}`);
      else if (anchor && !readFileSync(oAbs, 'utf8').includes(anchor)) add('AVISO', rel, `origem sem a entrada "#${anchor}" em ${oPath}`);
    }
  }

  if (sempre > sempreMax) add('AVISO', '.claude/rules/', `${sempre} regra(s) sem \`paths\` (orcamento ${sempreMax}) — carregam em toda sessao; de \`paths\` as que valem numa area`);
  if (linhasSempre > MAX_LINHAS_SEMPRE) add('AVISO', '.claude/rules/', `${linhasSempre} linhas sempre carregadas (limite ${MAX_LINHAS_SEMPRE})`);

  // migracao: correcao registrada sem regra ativa apontando para ela
  const { correcoes, pendentes } = scanLearnings(root);
  const origens = new Set(rules.filter((r) => r.learned && r.fm?.origem).map((r) => String(r.fm.origem)));
  const semRegra = correcoes.filter((c) => !c.date || ![...origens].some((o) => o.startsWith(`${c.file}#`) && o.includes(c.date)));
  if (semRegra.length) add('AVISO', 'docs/project/learnings/', `${semRegra.length} [CORRECAO DO USUARIO] sem regra ativa — converter em .claude/rules/learned/ (molde: docs/templates/rule-template.md): ${semRegra.slice(0, 3).map((c) => `${basename(c.file)}#${c.date || '?'}`).join(', ')}${semRegra.length > 3 ? '…' : ''}`);

  const erros = problems.filter((p) => p.nivel === 'ERRO').length;
  const avisos = problems.length - erros;
  const summary = { total: rules.length, learned: rules.filter((r) => r.learned).length, comPaths, sempre, linhasSempre, pendentes, correcoesSemRegra: semRegra.length, erros, avisos };
  const line = `memoria: ${summary.learned} regra(s) ativa(s) (${comPaths} por caminho · ${sempre} sempre)`
    + (pendentes ? ` · ${pendentes} descoberta(s) pendente(s)` : '')
    + (semRegra.length ? ` · ${semRegra.length} correcao(oes) sem regra` : '')
    + (problems.length ? ` · ${erros} erro(s), ${avisos} aviso(s)` : ' · ok');
  return { rules, problems, summary, line };
}

export function formatReport(res) {
  const out = [res.line];
  for (const p of res.problems) out.push(`[${p.nivel}] ${p.arquivo}: ${p.msg}`);
  return out.join('\n');
}

// --- auto-teste -------------------------------------------------------------------------------------------

function selfTest() {
  const root = mkdtempSync(join(tmpdir(), 'praxis-memory-check-'));
  const w = (rel, txt) => { const p = join(root, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, txt, 'utf8'); };
  const fm = (over = {}) => {
    const base = { paths: '["src/**/*.ts"]', dominio: 'frontend', medido_em: '2026-10-01', derruba_com: '"grep x"', vale_enquanto: '"y"', check: '"manual"', origem: '"docs/project/learnings/frontend-learnings.md#2026-01-01"', ...over };
    return '---\n' + Object.entries(base).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`).join('\n') + '\n---\n';
  };
  const corpo = (fonte = 'src/a.ts:1') => `**Regra**: faca X.\n**Escopo**: todo o frontend.\n**Fonte**: ${fonte}\n**Por que**: correcao do usuario.\n`;
  w('src/a.ts', 'export const a = 1;\n');
  w('docs/project/learnings/frontend-learnings.md', '# F\n\n### 2026-01-01 — [CORRECAO DO USUARIO] durante X\n- **Regra derivada**: faca X\n\n### 2026-02-02 — [CORRECAO DO USUARIO] durante Y\n- **Regra derivada**: faca Y\n\n### 2026-03-03 — @x durante Z\n- **Descoberta**: d\n- **Status**: pendente\n');
  w('.claude/rules/learned/frontend-ok.md', fm() + corpo());
  w('.claude/rules/learned/frontend-quebrada.md', '---\npaths: ["src/**"]\ndominio: frontend\n' + corpo());
  w('.claude/rules/learned/backend-fonte-morta.md', fm({ dominio: 'backend', paths: '["api/**"]', origem: '"docs/project/learnings/backend-learnings.md#2026-01-01"' }) + corpo('src/nao-existe.ts:3, src/a.ts:40'));
  w('.claude/rules/learned/process-vencida.md', fm({ dominio: 'process', paths: null, medido_em: '2020-01-01' }) + corpo('—'));
  w('.claude/rules/learned/process-longa.md', fm({ dominio: 'process', paths: null }) + corpo('—') + 'l5\nl6\nl7\nl8\nl9\n');
  w('.claude/rules/learned/errado-prefixo.md', fm({ dominio: 'business', paths: '["docs/specs/**"]' }) + corpo('—'));
  w('.claude/rules/minha-regra.md', 'Regra do usuario, sem frontmatter.\n');

  const res = checkMemory(root, { sempreMax: 2, now: '2026-11-05T00:00:00Z' });
  const has = (nivel, arquivo, re) => res.problems.some((p) => p.nivel === nivel && p.arquivo.endsWith(arquivo) && re.test(p.msg));
  const casos = [
    ['regra valida sem problema', !res.problems.some((p) => p.arquivo.endsWith('frontend-ok.md'))],
    ['frontmatter sem fechamento = ERRO', has('ERRO', 'frontend-quebrada.md', /sem fechamento/)],
    ['fonte morta (arquivo) = ERRO', has('ERRO', 'backend-fonte-morta.md', /nao-existe\.ts nao existe/)],
    ['fonte morta (linha) = ERRO', has('ERRO', 'backend-fonte-morta.md', /a\.ts:40/)],
    ['origem ausente = AVISO', has('AVISO', 'backend-fonte-morta.md', /origem nao existe/)],
    ['medido_em vencido = AVISO', has('AVISO', 'process-vencida.md', /vencido/)],
    ['corpo longo = ERRO', has('ERRO', 'process-longa.md', /linhas \(maximo 8\)/)],
    ['prefixo do dominio = AVISO', has('AVISO', 'errado-prefixo.md', /prefixo do dominio/)],
    ['orcamento de regras sempre = AVISO', has('AVISO', '.claude/rules/', /sem `paths` \(orcamento 2\)/)],
    ['correcao sem regra = 1', res.summary.correcoesSemRegra === 1 && has('AVISO', 'docs/project/learnings/', /1 \[CORRECAO DO USUARIO\] sem regra/)],
    ['pendentes = 1', res.summary.pendentes === 1],
    ['regra do usuario fora de learned nao e validada', !res.problems.some((p) => p.arquivo.endsWith('minha-regra.md'))],
    // "sempre" = 4: as duas sem paths, a do usuario sem frontmatter e a QUEBRADA (frontmatter ilegivel carrega em toda sessao)
    ['contagem: 7 arquivos, 6 learned, 4 sempre', res.summary.total === 7 && res.summary.learned === 6 && res.summary.sempre === 4],
  ];
  rmSync(root, { recursive: true, force: true });
  let falhas = 0;
  for (const [nome, ok] of casos) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome}`); if (!ok) falhas++; }
  if (falhas) { console.error(`memory-check --self-test: ${falhas} falha(s)`); console.error(formatReport(res)); process.exit(1); }
  console.log(`memory-check --self-test: ok (${casos.length} casos).`);
}

// --- CLI --------------------------------------------------------------------------------------------------

// No Windows o mesmo caminho pode chegar com a letra da unidade em caixas diferentes (C:/ e c:/).
const samePath = (a, b) => (process.platform === 'win32' ? posix(a).toLowerCase() === posix(b).toLowerCase() : posix(a) === posix(b));
const isMain = process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  try {
    if (args.includes('--self-test')) { selfTest(); process.exit(0); }
    const rootArg = args[args.indexOf('--root') + 1];
    const root = args.includes('--root') && rootArg && !rootArg.startsWith('--') ? rootArg : process.cwd();
    const res = checkMemory(root);
    if (args.includes('--json')) console.log(JSON.stringify(res, null, 2));
    else if (args.includes('--quiet')) console.log(res.line + (res.problems.length ? ' — node .claude/scripts/memory-check.mjs' : ''));
    else console.log(formatReport(res));
    process.exit(res.summary.erros ? 1 : 0);
  } catch (e) {
    console.error(`memory-check: ${e.message}`);
    process.exit(2);
  }
}
