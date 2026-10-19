#!/usr/bin/env node
// validate-kit.mjs — Checagens estruturais do kit, rodadas no CI.
//
// Uso: node scripts/validate-kit.mjs
//
// Falha (exit 1) quando:
//   - skill ou agent sem frontmatter / sem description
//   - agent sem name, ou dois agents/skills com o mesmo nome
//   - campo de frontmatter com grafia errada (ex.: user-invokable)
//   - `depends:` apontando para arquivo inexistente
//   - bloco `hooks` de .claude/settings.json diferente de .claude/hooks/hooks.manifest.json
//   - docs/project/learnings/ledger.md com entradas (o template deve ir vazio)
//   - hooks de qualidade (opt-in) ligados no settings.json versionado, ou script deles ausente
//   - JSON invalido em qualquer arquivo .json do kit
//   - agent eval sem contrato, ou contrato sem fixture
//   - caminhos pessoais/absolutos versionados (ex.: C:\Users\..., /home/<user>/), em qualquer arquivo de texto
//   - grafo de dependencias incompleto (ADR-0009): skill ou agent cita um ARQUIVO do kit que nao esta no
//     fecho do seu `depends` nem vem com a semente/nucleo — o `praxis.mjs add` puxaria a ferramenta sem ele.
//     Citacao de PASTA nao conta (e descricao, nao carga); pasta que e dependencia real entra no `depends`.
//     Documentacao do repositorio do kit (docs/kit-*, docs/guide/, praxis-design) nao e distribuida e fica fora.
//   - VERSION ausente ou fora do formato X.Y.Z
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, collectKit, collectCatalog, closure, filesOf, kitVersion, isKitOwned, resolveTool } from './lib/kit.mjs';

const errors = [];
const fail = (msg) => errors.push(msg);

const { skills, agents } = collectKit();

// Versao do catalogo
if (!/^\d+\.\d+\.\d+$/.test(kitVersion())) fail('VERSION: ausente ou fora do formato X.Y.Z');

// Grafo de dependencias (ADR-0009)
{
  const catalog = collectCatalog();
  const KIT_DOCS_RE = /^docs\/(kit-[^/]+|guide\/|project\/praxis-design\.md|project\/parallelism-map\.md)/;
  const base = new Set([
    ...filesOf(catalog, closure(catalog, catalog.core)),
    ...filesOf(catalog, closure(catalog, catalog.seed)),
    ...catalog.seeds,
  ]);
  for (const [p, t] of Object.entries(catalog.tools)) {
    for (const d of t.depends) {
      if (!resolveTool(catalog, d) && !catalog.seeds.includes(d)) fail(`${p}: depends "${d}" nao e ferramenta do catalogo (skill, agent, asset ou pasta do kit)`);
    }
    if (t.kind !== 'skill' && t.kind !== 'agent') continue;
    const covered = new Set([...filesOf(catalog, closure(catalog, [p])), ...base]);
    for (const c of t.cites) {
      if (KIT_DOCS_RE.test(c) || covered.has(c) || c === p || c.startsWith(p + '/')) continue;
      const isDir = existsSync(join(ROOT, c)) && statSync(join(ROOT, c)).isDirectory();
      if (isDir) continue;
      if (!isKitOwned(c)) continue; // arquivo do projeto (manifesto, learnings...), nao do kit
      fail(`${p}: cita ${c} fora do depends (ADR-0009 — a ferramenta chegaria ao projeto sem ele)`);
    }
  }
}

// Frontmatter obrigatorio
for (const s of skills) {
  if (!s.frontmatter) fail(`${s.path}: sem frontmatter`);
  else if (!s.description) fail(`${s.path}: sem description`);
  if (s.frontmatter && 'user-invokable' in s.frontmatter) {
    fail(`${s.path}: campo "user-invokable" (grafia correta: "user-invocable")`);
  }
}
for (const a of agents) {
  if (!a.frontmatter) fail(`${a.path}: sem frontmatter`);
  else {
    if (!a.frontmatter.name) fail(`${a.path}: sem name`);
    if (!a.description) fail(`${a.path}: sem description`);
  }
}

// Nomes unicos (o Claude Code resolve agents e skills pelo nome)
for (const [kind, list] of [['skill', skills], ['agent', agents]]) {
  const seen = new Map();
  for (const item of list) {
    if (seen.has(item.name)) fail(`${kind} "${item.name}" duplicado: ${seen.get(item.name)} e ${item.path}`);
    else seen.set(item.name, item.path);
  }
}

// depends: precisam existir
for (const item of [...skills, ...agents]) {
  for (const dep of item.depends) {
    if (!existsSync(join(ROOT, dep))) fail(`${item.path}: depends inexistente -> ${dep}`);
  }
}

// Hooks: settings.json e o manifest precisam estar em sincronia
const settings = JSON.parse(readFileSync(join(ROOT, '.claude', 'settings.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(ROOT, '.claude', 'hooks', 'hooks.manifest.json'), 'utf8'));
if (JSON.stringify(settings.hooks ?? {}) !== JSON.stringify(manifest.hooks ?? {})) {
  fail('.claude/settings.json: bloco "hooks" diverge de .claude/hooks/hooks.manifest.json');
}
for (const script of manifest.scripts ?? []) {
  if (!existsSync(join(ROOT, '.claude', 'hooks', script))) fail(`hooks.manifest.json: script inexistente -> ${script}`);
}

// Arquivos de estado precisam chegar zerados para quem usa o template
const ledger = readFileSync(join(ROOT, 'docs', 'project', 'learnings', 'ledger.md'), 'utf8');
const ledgerBody = ledger.split('<!-- LEDGER:START -->')[1] ?? '';
const ledgerEntries = ledgerBody.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('<!--'));
if (ledgerEntries.length) {
  fail(`docs/project/learnings/ledger.md: ${ledgerEntries.length} entrada(s) apos LEDGER:START — o template deve ir vazio (nao registre linhas (llm) ao editar o kit; as (auto) vao para ledger-auto.md)`);
}

// Hooks de qualidade OPT-IN: scripts existem e o bloco NAO esta ligado no settings.json versionado
const QUALITY = join(ROOT, '.claude', 'hooks', 'quality', 'hooks.quality.json');
if (existsSync(QUALITY)) {
  let quality = null;
  try { quality = JSON.parse(readFileSync(QUALITY, 'utf8')); } catch (e) { fail(`.claude/hooks/quality/hooks.quality.json: JSON invalido (${e.message})`); }
  for (const script of quality?.scripts ?? []) {
    if (!existsSync(join(ROOT, '.claude', 'hooks', 'quality', script))) fail(`hooks.quality.json: script inexistente -> ${script}`);
  }
  if (JSON.stringify(settings.hooks ?? {}).includes('hooks/quality/')) {
    fail('.claude/settings.json: hooks de qualidade sao opt-in — o bloco vai para o settings.local.json de quem aceitar no /setup, nunca para o settings.json versionado');
  }
}

// Todo .json versionado precisa ser JSON valido (um JSON quebrado num molde so aparece no usuario)
function walkJson(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkJson(full);
    else if (entry.endsWith('.json')) {
      try { JSON.parse(readFileSync(full, 'utf8')); } catch (e) { fail(`${relative(ROOT, full).split('\\').join('/')}: JSON invalido (${e.message})`); }
    }
  }
}
walkJson(ROOT);

// Agent evals: todo contrato tem fixture e vice-versa; o agent do contrato existe e casa com a pasta
const EVALS = join(ROOT, '.claude', 'evals', 'agents');
if (existsSync(EVALS)) {
  const agentNames = new Set(agents.map((a) => a.name));
  const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory()) : []);
  const fixtures = join(EVALS, 'fixtures');
  const contratos = join(EVALS, 'contratos');
  for (const agent of dirs(contratos)) {
    if (!agentNames.has(agent)) fail(`.claude/evals/agents/contratos/${agent}: agent inexistente no kit`);
    for (const f of readdirSync(join(contratos, agent)).filter((x) => x.endsWith('.yml'))) {
      const caso = f.slice(0, -4);
      const fixtureDir = join(fixtures, agent, caso);
      if (!existsSync(fixtureDir) || !readdirSync(fixtureDir).length) fail(`.claude/evals/agents/contratos/${agent}/${f}: sem fixture em fixtures/${agent}/${caso}/`);
      const m = readFileSync(join(contratos, agent, f), 'utf8').match(/^agent:\s*(\S+)/m);
      if (!m || m[1] !== agent) fail(`.claude/evals/agents/contratos/${agent}/${f}: campo agent (${m ? m[1] : 'ausente'}) diferente da pasta`);
    }
  }
  for (const agent of dirs(fixtures)) {
    for (const caso of dirs(join(fixtures, agent))) {
      if (!existsSync(join(contratos, agent, `${caso}.yml`))) fail(`.claude/evals/agents/fixtures/${agent}/${caso}: sem contrato em contratos/${agent}/${caso}.yml`);
    }
  }
}

// Caminhos pessoais/absolutos
const PERSONAL = /[A-Za-z]:[\\/]{1,2}Users[\\/]{1,2}[A-Za-z]|(?:^|[\s'"`(])\/Users\/[A-Za-z]|\/home\/[A-Za-z][\w.-]*\//;
const SKIP_DIRS = new Set(['.git', 'node_modules']);
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(md|json|mjs|js|cjs|ts|tsx|jsx|cs|yml|yaml|ps1|sh|txt|css|html)$/.test(entry)) {
      const rel = relative(ROOT, full).split('\\').join('/');
      if (rel === 'scripts/validate-kit.mjs') continue;
      readFileSync(full, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (PERSONAL.test(line)) fail(`${rel}:${i + 1}: caminho pessoal/absoluto versionado`);
      });
    }
  }
}
walk(ROOT);

if (errors.length) {
  console.error(`validate-kit: ${errors.length} problema(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`validate-kit: ok (${skills.length} skills, ${agents.length} agents).`);
