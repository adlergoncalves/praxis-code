#!/usr/bin/env node
// check-learnings.mjs — Checks DETERMINISTICOS dos learnings que mais regrediram (kit Praxis).
//
// Motivacao: learnings documentados regridem porque dependem de o agente "lembrar de ler". Este
// script transforma tres regressoes recorrentes de frontend em checks mecanicos, executados no
// /execute (gates da fatia) e no /verify-all.
//
// Checks implementados (todos CROSS-REFERENCIA, nao regex isolado):
//   1. navigate-route   — navigate('/x') / <Link to="/x"> apontando para rota que NAO existe no
//                         roteador (App.tsx / routes.tsx) — o "404 silencioso".
//   2. css-var          — var(--token) usado no codigo SEM definicao em nenhum .css/.scss do projeto
//                         (as definicoes sao coletadas da raiz do projeto, nao so do alvo).
//   3. select-id        — <Combobox/Select> de entidade de dominio renderizando o ID em vez do nome
//                         (heuristico: value={x.id} sem label/children/getOptionLabel usando nome).
//
// Uso (direto):
//   node .claude/scripts/frontend/check-learnings.mjs <path>
//   node .claude/scripts/frontend/check-learnings.mjs <path> --json
//   node .claude/scripts/frontend/check-learnings.mjs <path> --only navigate-route,css-var
//   node .claude/scripts/frontend/check-learnings.mjs <path> --root <raiz>   (default: cwd)
//
// Exit codes (iguais a detect-cliches.mjs):
//   0 — nenhum erro (warnings nao bloqueiam)
//   1 — erros encontrados
//   2 — falha de execucao (path invalido, etc.)
//
// IMPORTANTE — calibracao:
//   Comecar conservador. Cada falso-positivo vira entrada em frontend-learnings.md e um ajuste de
//   heuristica aqui (mesma filosofia do detect-cliches.mjs). E melhor deixar passar um caso duvidoso
//   do que bloquear trabalho legitimo: por isso `select-id` nasce como WARN, nao ERROR.

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname, relative, basename, resolve, dirname, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Configuracao
// ---------------------------------------------------------------------------

const CODE_EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro']);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
  'coverage', 'out', '.cache', '.parcel-cache', '.turbo', '.vercel', '.netlify',
  '.claude',
]);

// Arquivos que tipicamente declaram o roteador (cobrimos React Router, TanStack, etc.).
const ROUTER_FILE_RE = /(^|[\\/])(App|app|routes?|router|Router|main)\.(t|j)sx?$/;

// ---------------------------------------------------------------------------
// Helpers de varredura (espelham detect-cliches.mjs)
// ---------------------------------------------------------------------------

async function* walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walk(full);
    } else if (CODE_EXTENSIONS.has(extname(e.name))) {
      yield full;
    }
  }
}

function offsetToLineCol(content, offset) {
  let line = 1, col = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === '\n') { line++; col = 1; } else { col++; }
  }
  return { line, col };
}

async function readSafe(p) {
  try { return await readFile(p, 'utf8'); } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Coleta de "indices" do projeto (a parte cross-referencia)
// ---------------------------------------------------------------------------

// 1) Rotas declaradas: pega `path="/x"`, `path: '/x'`, `<Route path="x">`, createBrowserRouter etc.
//    Heuristico amplo de proposito — preferimos um catalogo grande (menos falso-positivo de
//    "rota inexistente") a um catalogo restrito.
function collectDeclaredRoutes(files) {
  const routes = new Set();
  let routerFound = false;
  const PATH_RE = /\bpath\s*[:=]\s*["'`]([^"'`]*)["'`]/g;
  const INDEX_RE = /\bindex\b\s*[:=]\s*(?:true|\{true\})/;

  for (const { rel, content } of files) {
    const looksRouter = ROUTER_FILE_RE.test(rel) || /createBrowserRouter|createRouter|<Routes\b|<Route\b|RouterProvider/.test(content);
    if (!looksRouter) continue;
    routerFound = true;
    let m;
    while ((m = PATH_RE.exec(content)) !== null) {
      routes.add(normalizeRoute(m[1]));
    }
    if (INDEX_RE.test(content)) routes.add('/');
  }
  return { routes, routerFound };
}

// Normaliza para comparacao: tira query/hash, colapsa params (:id -> :), garante leading slash.
function normalizeRoute(r) {
  let s = String(r).split('?')[0].split('#')[0].trim();
  if (s === '' || s === '/') return '/';
  if (!s.startsWith('/')) s = '/' + s;
  // remove trailing slash (exceto raiz)
  if (s.length > 1) s = s.replace(/\/+$/, '');
  return s;
}

// Um destino casa com uma rota declarada se:
//  - igual exato, OU
//  - bate segmento-a-segmento tratando `:param` e `*` como curinga, OU
//  - e prefixo de alguma rota declarada (nested/index routes).
function routeMatches(target, declared) {
  const t = normalizeRoute(target);
  if (declared.has(t)) return true;
  const tSeg = t.split('/').filter(Boolean);
  for (const d of declared) {
    const dSeg = d.split('/').filter(Boolean);
    // prefixo (layout/nested): /vendas casa com declarada /vendas/:id
    if (dSeg.length >= tSeg.length) {
      let ok = true;
      for (let i = 0; i < tSeg.length; i++) {
        const ds = dSeg[i];
        if (ds === '*' || ds.startsWith(':')) continue;
        if (ds !== tSeg[i]) { ok = false; break; }
      }
      if (ok) return true;
    }
    // declarada e prefixo do destino: declarada /vendas/:id, destino /vendas/123/editar -> nao casa,
    // mas declarada /vendas casa destino /vendas (ja coberto acima). Mantemos conservador.
  }
  return false;
}

// 2) CSS vars definidas: --x: ... em qualquer .css/.scss do projeto. Varre a raiz do projeto (e o
// alvo, se estiver fora dela): o tema costuma viver em src/index.css, fora da pasta validada.
async function collectDefinedCssVars(dirs) {
  const defined = new Set();
  const CSS_EXT = new Set(['.css', '.scss', '.sass', '.less']);
  const DEF_RE = /(--[A-Za-z0-9-_]+)\s*:/g;
  for (const dir of dirs) {
    for await (const file of walkExt(dir, CSS_EXT)) {
      const content = await readSafe(file);
      let m;
      while ((m = DEF_RE.exec(content)) !== null) defined.add(m[1]);
    }
  }
  return defined;
}

async function* walkExt(dir, extSet) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walkExt(full, extSet);
    } else if (extSet.has(extname(e.name))) {
      yield full;
    }
  }
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

// CHECK 1 — navigate / Link / redirect para rota inexistente.
function checkNavigateRoutes(files, declared, routerFound) {
  const findings = [];
  if (!routerFound) return findings; // sem roteador detectado, nao da pra cruzar — silencioso.

  // navigate('/x'), navigate("/x"), <Link to="/x">, <Navigate to="/x">, redirect('/x')
  const NAV_RES = [
    /\bnavigate\(\s*["'`](\/[^"'`]*)["'`]/g,
    /\b(?:to|href)\s*=\s*["'`](\/[^"'`]*)["'`]/g,
    /\bredirect\(\s*["'`](\/[^"'`]*)["'`]/g,
  ];

  for (const { rel, content } of files) {
    for (const re of NAV_RES) {
      const r = new RegExp(re.source, re.flags);
      let m;
      while ((m = r.exec(content)) !== null) {
        const target = m[1];
        // ignora templates dinamicos com interpolacao parcial (pegamos so o literal estatico)
        if (target.includes('${') || target.includes('{')) continue;
        if (!routeMatches(target, declared)) {
          const { line, col } = offsetToLineCol(content, m.index);
          findings.push({
            rule: 'navigate-route',
            severity: 'error',
            file: rel, line, column: col,
            match: m[0].length > 80 ? m[0].slice(0, 77) + '...' : m[0],
            description: `Navegacao para "${target}" que nao casa com nenhuma rota declarada no roteador.`,
            suggestion: 'Declare a rota no App.tsx/routes.tsx ou corrija o destino.',
          });
        }
        if (m.index === r.lastIndex) r.lastIndex++;
      }
    }
  }
  return findings;
}

// CHECK 2 — var(--token) usado sem definicao em CSS.
function checkCssVars(files, defined) {
  const findings = [];
  if (defined.size === 0) return findings; // sem tema CSS coletado — nao cruza.
  const USE_RE = /var\(\s*(--[A-Za-z0-9-_]+)/g;
  for (const { rel, content } of files) {
    let m;
    while ((m = USE_RE.exec(content)) !== null) {
      const token = m[1];
      if (!defined.has(token)) {
        const { line, col } = offsetToLineCol(content, m.index);
        findings.push({
          rule: 'css-var',
          severity: 'error',
          file: rel, line, column: col,
          match: `var(${token})`,
          description: `Token CSS "${token}" usado mas nao definido em nenhum index.css/*.css do projeto.`,
          suggestion: 'Defina o token no tema (index.css) ou use um token existente. Nunca cor hardcoded (regra de DS).',
        });
      }
    }
  }
  return findings;
}

// CHECK 3 — Select/Combobox de entidade renderizando ID em vez de nome (heuristico, WARN).
// Procura JSX de option/item cujo conteudo visivel e {x.id} (ou value e label sao ambos id).
function checkSelectId(files) {
  const findings = [];
  // <SelectItem value={x.id}>{x.id}</SelectItem> | <option value={x.id}>{x.id}</option>
  // | <CommandItem ...>{x.id}</CommandItem>
  const ITEM_RE = /<(SelectItem|option|CommandItem|MenuItem|Option)\b[^>]*>\s*\{[\s]*([A-Za-z_$][\w$]*)\.id[\s]*\}\s*<\/\1>/g;
  for (const { rel, content } of files) {
    let m;
    while ((m = ITEM_RE.exec(content)) !== null) {
      const { line, col } = offsetToLineCol(content, m.index);
      findings.push({
        rule: 'select-id',
        severity: 'warn',
        file: rel, line, column: col,
        match: m[0].length > 80 ? m[0].slice(0, 77) + '...' : m[0],
        description: `Item de select renderizando "${m[2]}.id" como texto visivel — provavel ID exibido em vez do nome.`,
        suggestion: 'Renderize o nome/label da entidade (ex.: {x.nome}).',
      });
      if (m.index === ITEM_RE.lastIndex) ITEM_RE.lastIndex++;
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const ALL_CHECKS = ['navigate-route', 'css-var', 'select-id'];

export async function check(targetPath, options = {}) {
  if (!existsSync(targetPath)) throw new Error(`Path nao encontrado: ${targetPath}`);
  const st = await stat(targetPath);
  const rootPath = st.isDirectory() ? targetPath : '.';
  const only = options.only && options.only.length ? new Set(options.only) : null;
  const enabled = (id) => !only || only.has(id);

  // Carrega todos os arquivos de codigo uma vez (precisamos do conjunto inteiro p/ cross-ref).
  const files = [];
  if (st.isDirectory()) {
    for await (const filePath of walk(targetPath)) {
      files.push({ rel: relative(rootPath, filePath) || filePath, content: await readSafe(filePath) });
    }
  } else if (CODE_EXTENSIONS.has(extname(targetPath))) {
    files.push({ rel: basename(targetPath), content: await readSafe(targetPath) });
  }

  const findings = [];

  if (enabled('navigate-route')) {
    const { routes, routerFound } = collectDeclaredRoutes(files);
    findings.push(...checkNavigateRoutes(files, routes, routerFound));
  }
  if (enabled('css-var')) {
    const projectRoot = resolve(options.root || process.cwd());
    const targetDir = resolve(st.isDirectory() ? targetPath : dirname(targetPath));
    const relToRoot = relative(projectRoot, targetDir);
    const inside = !relToRoot.startsWith('..') && !isAbsolute(relToRoot);
    const defined = await collectDefinedCssVars(inside ? [projectRoot] : [projectRoot, targetDir]);
    findings.push(...checkCssVars(files, defined));
  }
  if (enabled('select-id')) {
    findings.push(...checkSelectId(files));
  }

  const summary = {
    files_scanned: files.length,
    checks_run: ALL_CHECKS.filter(enabled),
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warn').length,
    total: findings.length,
  };
  return { findings, summary };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function formatText(report) {
  const lines = [];
  const { findings, summary } = report;
  if (findings.length === 0) {
    lines.push('OK  Nenhuma regressao de learning detectada.');
    lines.push(`    Checks: ${summary.checks_run.join(', ')} | Arquivos: ${summary.files_scanned}`);
    return lines.join('\n');
  }
  const byFile = {};
  for (const f of findings) (byFile[f.file] = byFile[f.file] || []).push(f);
  for (const [file, fs] of Object.entries(byFile)) {
    lines.push(`\n${file}`);
    for (const f of fs) {
      lines.push(`  ${f.severity.toUpperCase().padEnd(5)} ${f.rule}  L${f.line}:${f.column}`);
      lines.push(`        ${f.description}`);
      lines.push(`        match: ${f.match}`);
      lines.push(`        sugestao: ${f.suggestion}`);
    }
  }
  lines.push('');
  lines.push(`Resumo: ${summary.errors} erro(s), ${summary.warnings} aviso(s) em ${summary.files_scanned} arquivo(s).`);
  return lines.join('\n');
}

function flagValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  return v && !v.startsWith('-') ? v : null;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node check-learnings.mjs <path> [--json] [--only navigate-route,css-var,select-id] [--root <raiz>]');
    process.exit(args.length === 0 ? 2 : 0);
  }
  const wantJson = args.includes('--json');
  const onlyRaw = flagValue(args, '--only');
  const rootRaw = flagValue(args, '--root');
  const only = onlyRaw ? onlyRaw.split(',').map((s) => s.trim()).filter(Boolean) : null;
  const targetPath = args.find((a) => !a.startsWith('-') && a !== onlyRaw && a !== rootRaw);
  if (!targetPath) { console.error('ERRO: path nao informado.'); process.exit(2); }

  let report;
  try { report = await check(targetPath, { only, root: rootRaw }); }
  catch (err) { console.error(`ERRO: ${err.message}`); process.exit(2); }

  console.log(wantJson ? JSON.stringify(report, null, 2) : formatText(report));
  process.exit(report.summary.errors > 0 ? 1 : 0);
}

const entry = process.argv[1]; // undefined quando importado via `node -e` ou como modulo
const isDirectRun = !!entry && (
  import.meta.url === `file://${entry.replace(/\\/g, '/')}` ||
  import.meta.url.endsWith(entry.split(/[\\/]/).pop())
);
if (isDirectRun) main();
