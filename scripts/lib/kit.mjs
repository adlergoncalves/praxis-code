// Helpers compartilhados pelos scripts de manutencao do kit (generate-index, validate-kit, build-seed).
// Zero dependencias — so Node >= 18.
//
// Alem do inventario de skills e agents, monta o CATALOGO (ADR-0009): cada ferramenta do kit com tipo,
// arquivos (hash normalizado para LF), dependencias declaradas (`depends:` no frontmatter) e dependencias
// computadas (caminhos citados em assets, imports relativos em scripts). E o que o `praxis.mjs` le para
// puxar uma ferramenta com tudo de que ela precisa.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename, extname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const REPO_URL = 'https://github.com/adlergoncalves/praxis-code.git';

/** Versao do catalogo: arquivo VERSION na raiz (a tag git e `v` + VERSION). */
export function kitVersion() {
  const p = join(ROOT, 'VERSION');
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : '0.0.0';
}

const rel = (...p) => join(...p).split('\\').join('/');
const toPosix = (p) => String(p).split('\\').join('/');

/** Extrai o frontmatter YAML simples (chave: valor + listas "  - item"). */
export function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.+)$/);
    if (listKey && item) {
      fm[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value === '') {
      fm[key] = [];
      listKey = key;
    } else {
      fm[key] = unquote(value);
      listKey = null;
    }
  }
  return fm;
}

function unquote(s) {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/** Lista skills (.claude/skills/<nome>/SKILL.md) e agents (.claude/agents/<dominio>/<nome>.md). */
export function collectKit() {
  const skills = [];
  const skillsDir = join(ROOT, '.claude', 'skills');
  for (const dir of readdirSync(skillsDir).sort()) {
    const file = join(skillsDir, dir, 'SKILL.md');
    if (!statSync(join(skillsDir, dir)).isDirectory() || !existsSync(file)) continue;
    const fm = parseFrontmatter(readFileSync(file, 'utf8'));
    skills.push({
      name: (fm && typeof fm.name === 'string' && fm.name) || dir,
      path: rel('.claude/skills', dir, 'SKILL.md'),
      dir: rel('.claude/skills', dir),
      description: fm?.description ?? '',
      domain: fm?.domain ?? null,
      depends: Array.isArray(fm?.depends) ? fm.depends : [],
      frontmatter: fm,
    });
  }

  const agents = [];
  const agentsDir = join(ROOT, '.claude', 'agents');
  for (const domain of readdirSync(agentsDir).sort()) {
    const domainDir = join(agentsDir, domain);
    if (!statSync(domainDir).isDirectory()) continue;
    for (const f of readdirSync(domainDir).filter((x) => x.endsWith('.md')).sort()) {
      const fm = parseFrontmatter(readFileSync(join(domainDir, f), 'utf8'));
      agents.push({
        name: (fm && typeof fm.name === 'string' && fm.name) || basename(f, '.md'),
        domain,
        path: rel('.claude/agents', domain, f),
        description: fm?.description ?? '',
        depends: Array.isArray(fm?.depends) ? fm.depends : [],
        frontmatter: fm,
      });
    }
  }
  return { skills, agents };
}

// --- catalogo (ADR-0009) -------------------------------------------------------------------------

/** Arquivos da semente que o lock acompanha (do kit; atualizaveis). */
export const SEED_TRACKED = [
  '.claude/settings.json',
  '.claude/praxis/praxis.mjs',
  '.claude/praxis/rules.md',
  '.claude/skills/start',
];

/** Arquivos da semente que sao do projeto desde o inicio (copiados uma vez, nunca acompanhados). */
export const SEED_PROJECT = ['CLAUDE.md'];

/** Nucleo: puxado pelo `praxis.mjs init` no primeiro /start. */
export const CORE = [
  '.claude/agents/orchestration/praxis.md',
  '.claude/skills/praxis',
  '.claude/skills/mode',
  '.claude/skills/setup',
  '.claude/hooks/_lib.mjs',
  '.claude/hooks/reconcile.mjs',
  '.claude/hooks/capture.mjs',
  '.claude/hooks/hooks.manifest.json',
  'docs/project/learnings/README.md',
];

/** Sementes de projeto: copiadas pelo init se ausentes; depois sao do projeto (fora do lock). */
export const PROJECT_SEEDS = [
  'docs/project/manifest.md',
  'docs/project/constitution.md',
  'docs/project/discovery.md',
  'docs/project/glossary.md',
  'docs/project/learnings/ledger.md',
  'docs/project/learnings/frontend-learnings.md',
  'docs/project/learnings/backend-learnings.md',
  'docs/project/learnings/business-learnings.md',
  'docs/project/learnings/architecture-learnings.md',
  'docs/project/learnings/process-learnings.md',
  'docs/adr/0000-adr-index.md',
];

/** Modulos: conjuntos nomeados que /start e /setup puxam de uma vez (`praxis.mjs add --module <nome>`). */
export const MODULES = {
  'linha-novo': ['discovery', 'architect', 'define', 'implement', 'validate', 'review'],
  'linha-legado': ['reverse-engineer', 'discovery', 'architect', 'define', 'implement', 'validate', 'review'],
  'linha-adocao': ['adopt', 'implement', 'validate', 'review', 'debug', 'quickfix'],
  'frontend': ['ux', 'design', 'prototype', 'frontend-validate'],
  'design-system': ['ds-init', 'ds-component'],
  'backend': ['backend-validate', 'backend-scaffold'],
  'ddd': ['ddd-estrategico'],
  'qualidade-hooks': ['.claude/hooks/quality'],
  'evals': ['agent-eval'],
};

/** Raizes do que e do kit e pode ser puxado como asset ou grupo. */
const ASSET_ROOTS = [
  '.claude/hooks', '.claude/scripts', '.claude/reference', '.claude/assets', '.claude/evals',
  '.claude/praxis', 'docs/templates', 'docs/adr/templates',
];
const ASSET_FILES = ['docs/project/learnings/README.md', 'THIRD_PARTY_NOTICES.md', '.claude/settings.json'];
const KIT_ADR_RE = /^docs\/adr\/00\d\d-.*\.md$/;

/** Grupos: pastas que so fazem sentido inteiras (mais as que aparecem em algum depends). */
const KNOWN_GROUPS = ['.claude/reference/frontend/third-party', 'docs/templates/detail', '.claude/evals/agents', 'docs/adr/templates'];
const GROUP_EXTRA_FILES = { '.claude/reference/frontend/third-party': ['THIRD_PARTY_NOTICES.md'] };

/** Caminhos citados que nunca sao dependencia: ferramental e documentacao do repositorio do kit. */
const KIT_DEV_RE = /^(scripts\/|seed\/|\.github\/|docs\/(kit-[^/]+|guide\/|project\/praxis-design\.md|project\/parallelism-map\.md))/;

const TEXT_EXT = new Set(['.md', '.mjs', '.js', '.json', '.yml', '.yaml', '.txt', '.css', '.html', '.ts', '.tsx', '.cs', '.ps1', '.sh', '.toml']);
// Tudo que nao e binario conhecido e hasheado como texto (LF): arquivo sem extensao (LICENSE) tambem sofre autocrlf.
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.zip', '.gz']);

export function isKitOwned(p) {
  p = toPosix(p);
  return ASSET_ROOTS.some((r) => p === r || p.startsWith(r + '/')) || ASSET_FILES.includes(p) || KIT_ADR_RE.test(p)
    || p.startsWith('.claude/skills/') || p.startsWith('.claude/agents/');
}

/** sha256 do conteudo com fim de linha normalizado para LF (texto); bytes crus para binario. */
export function hashFile(abs) {
  const buf = readFileSync(abs);
  const text = !BINARY_EXT.has(extname(abs).toLowerCase());
  const data = text ? Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8') : buf;
  return createHash('sha256').update(data).digest('hex');
}

export function walkFiles(dirAbs) {
  const out = [];
  if (!existsSync(dirAbs)) return out;
  for (const e of readdirSync(dirAbs, { withFileTypes: true })) {
    const full = join(dirAbs, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out.sort((a, b) => { const x = toPosix(a), y = toPosix(b); return x < y ? -1 : x > y ? 1 : 0; });
}

const PLACEHOLDER = /[{}*<>«»]/;

/** Caminhos do kit citados num texto (markdown) ou importados (script). Retorna so os que existem. */
export function citedPaths(content, filePath) {
  const ext = extname(filePath).toLowerCase();
  const found = new Set();
  if (ext === '.mjs' || ext === '.js') {
    const re = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const p = toPosix(relative(ROOT, resolve(join(ROOT, dirname(filePath)), m[1])));
      if (existsSync(join(ROOT, p))) found.add(p);
    }
    return [...found];
  }
  const re = /(?:`|@)((?:\.claude|docs)\/[A-Za-z0-9_./\-{}*<>«»]+|THIRD_PARTY_NOTICES\.md|CLAUDE\.md)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    let p = m[1].replace(/[./]+$/, '');
    if (PLACEHOLDER.test(p) || KIT_DEV_RE.test(p)) continue;
    if (p === 'CLAUDE.md') continue; // do projeto
    if (existsSync(join(ROOT, p))) found.add(p);
  }
  return [...found];
}

function normalizeDep(dep) {
  dep = toPosix(dep).replace(/\/$/, '');
  const m = dep.match(/^(\.claude\/skills\/[^/]+)\/SKILL\.md$/);
  return m ? m[1] : dep;
}

/**
 * Monta o catalogo: { version, repo, seed, core, seeds, skills, agents, tools }.
 * tools[path] = { kind: skill|agent|asset|group, name?, domain?, description?, files: {rel: sha}, depends: [path] }
 */
export function collectCatalog() {
  const { skills, agents } = collectKit();
  const tools = {};
  const fileHashes = (paths) => Object.fromEntries(paths.map((p) => [toPosix(p), hashFile(join(ROOT, p))]));
  const relFiles = (dirRel) => walkFiles(join(ROOT, dirRel)).map((f) => toPosix(relative(ROOT, f)));

  for (const s of skills) {
    const files = relFiles(s.dir);
    const cites = new Set();
    for (const f of files) if (TEXT_EXT.has(extname(f))) for (const c of citedPaths(readFileSync(join(ROOT, f), 'utf8'), f)) cites.add(c);
    tools[s.dir] = { kind: 'skill', name: s.name, domain: s.domain, description: s.description, files: fileHashes(files), depends: s.depends.map(normalizeDep), cites: [...cites].sort() };
  }
  for (const a of agents) {
    const content = readFileSync(join(ROOT, a.path), 'utf8');
    tools[a.path] = { kind: 'agent', name: a.name, domain: a.domain, description: a.description, files: fileHashes([a.path]), depends: a.depends.map(normalizeDep), cites: citedPaths(content, a.path).sort() };
  }

  // assets: todo arquivo das raizes do kit que nao e skill nem agent
  const assetFiles = new Set(ASSET_FILES.filter((p) => existsSync(join(ROOT, p))));
  for (const r of ASSET_ROOTS) for (const f of relFiles(r)) assetFiles.add(f);
  for (const f of readdirSync(join(ROOT, 'docs', 'adr'))) if (KIT_ADR_RE.test(`docs/adr/${f}`)) assetFiles.add(`docs/adr/${f}`);
  // asset: dependencias computadas = ARQUIVOS do kit que ele cita. Pasta citada em texto e descricao,
  // nao carga (o README dos evals cita a pasta das fixtures; puxa-las junto traria 80+ arquivos).
  // Pasta que e dependencia de verdade entra no `depends:` de quem precisa dela.
  const kitDep = (c) => isKitOwned(c) && !/^\.claude\/(skills|agents)$/.test(c) && statSync(join(ROOT, c)).isFile();
  for (const f of assetFiles) {
    const abs = join(ROOT, f);
    const deps = TEXT_EXT.has(extname(f)) ? citedPaths(readFileSync(abs, 'utf8'), f).filter((c) => c !== f && kitDep(c)) : [];
    tools[f] = { kind: 'asset', files: fileHashes([f]), depends: deps.sort() };
  }

  // grupos: pastas conhecidas + toda pasta do kit que aparece em depends ou citada por asset
  const groupDirs = new Set(KNOWN_GROUPS.filter((g) => existsSync(join(ROOT, g))));
  // pasta declarada no `depends:` de alguem vira grupo (e carga de verdade)
  const collectDirs = () => {
    for (const t of Object.values(tools)) for (const d of t.depends) if (isKitOwned(d) && existsSync(join(ROOT, d)) && statSync(join(ROOT, d)).isDirectory() && !tools[d]) groupDirs.add(d);
  };
  collectDirs();
  for (const g of groupDirs) {
    const files = [...relFiles(g), ...(GROUP_EXTRA_FILES[g] ?? []).filter((p) => existsSync(join(ROOT, p)))];
    const deps = new Set();
    for (const f of files) if (TEXT_EXT.has(extname(f))) for (const c of citedPaths(readFileSync(join(ROOT, f), 'utf8'), f)) if (!c.startsWith(g + '/') && c !== g && kitDep(c)) deps.add(c);
    tools[g] = { kind: 'group', files: fileHashes(files), depends: [...deps].sort() };
  }
  // dependencia de asset que aponta para pasta sem grupo registrado: registrar
  collectDirs();
  for (const g of groupDirs) if (!tools[g]) {
    const files = relFiles(g);
    tools[g] = { kind: 'group', files: fileHashes(files), depends: [] };
  }

  // ordem deterministica (o CI em Linux tem de gerar o mesmo catalog.json que o Windows)
  const byKey = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const sortedTools = byKey(Object.fromEntries(Object.entries(tools).map(([p, t]) => [p, { ...t, files: byKey(t.files), depends: [...new Set(t.depends)].sort() }])));

  return {
    version: kitVersion(),
    repo: REPO_URL,
    seed: SEED_TRACKED,
    seedProject: SEED_PROJECT,
    core: CORE,
    seeds: PROJECT_SEEDS,
    modules: MODULES,
    skills: Object.fromEntries(skills.map((s) => [s.name, s.dir])),
    agents: Object.fromEntries(agents.map((a) => [a.name, a.path])),
    tools: sortedTools,
  };
}

/** Resolve um pedido (nome de skill, nome de agent ou caminho) para o caminho da ferramenta. */
export function resolveTool(catalog, ref) {
  ref = toPosix(ref).replace(/\/$/, '');
  if (catalog.tools[ref]) return ref;
  if (catalog.skills[ref]) return catalog.skills[ref];
  if (catalog.agents[ref]) return catalog.agents[ref];
  const n = normalizeDep(ref);
  if (catalog.tools[n]) return n;
  // arquivo dentro de um grupo ou de uma skill
  for (const [p, t] of Object.entries(catalog.tools)) if (t.files[ref]) return p;
  return null;
}

/** Fecho transitivo: todas as ferramentas (caminhos) de que `ref` depende, inclusive ela. */
export function closure(catalog, refs) {
  const out = new Set();
  const stack = [...refs].map((r) => resolveTool(catalog, r)).filter(Boolean);
  while (stack.length) {
    const p = stack.pop();
    if (out.has(p)) continue;
    out.add(p);
    const t = catalog.tools[p];
    for (const d of t.depends) {
      const r = resolveTool(catalog, d);
      if (r && !out.has(r)) stack.push(r);
    }
  }
  return out;
}

/** Todos os arquivos cobertos por um conjunto de ferramentas. */
export function filesOf(catalog, toolPaths) {
  const out = new Set();
  for (const p of toolPaths) for (const f of Object.keys(catalog.tools[p]?.files ?? {})) out.add(f);
  return out;
}
