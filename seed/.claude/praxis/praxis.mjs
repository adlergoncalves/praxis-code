#!/usr/bin/env node
// praxis.mjs — o kit se monta dentro do projeto (ADR-0009).
//
// O projeto recebe a semente e puxa as ferramentas do catalogo (repositorio do kit, numa tag) na hora
// do uso. Este script e a unica coisa que escreve arquivo do kit no projeto. Zero dependencias: Node >= 18
// e git (clone raso do catalogo para um cache fora do projeto, compartilhado entre projetos da maquina).
//
// Uso: node .claude/praxis/praxis.mjs <comando> [args]
//   init                      clona a versao do lock para o cache, puxa o nucleo e copia as sementes de projeto
//   add <ref...>              puxa ferramentas: nome de skill/agent, caminho do kit, ou --module <nome>
//   list [--json]             catalogo (marca o que ja esta no projeto)
//   status [--json]           versao, pino, instaladas, personalizadas, pendentes, atualizacao pronta
//   check [--force]           rede: ha tag nova compativel? baixa para o cache e deixa o marcador (1x por dia)
//   apply [--major] [--force] aplica a atualizacao pronta (recusa com fatia WIP; major so com --major)
//   diff <ref>                diferenca entre o arquivo local e a versao do catalogo
//
// Lock: .claude/praxis.json (versionado) — repo, version, pin, ref, tools{path: {kind, files{path: sha}}}, pending.
// Estado local (gitignored): .claude/praxis.update.json (atualizacao pronta), .claude/praxis.check.json
// (ultima checagem), .claude/praxis.lock (concorrencia).
// Variaveis: PRAXIS_OFFLINE=1 e PRAXIS_DRIVER=1 desligam check/apply; PRAXIS_CACHE_DIR muda o cache.
// Exit: 0 ok · 1 recusado/erro declarado · 2 uso invalido.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, unlinkSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative, extname, basename } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Tudo que nao e binario conhecido e hasheado como texto com fim de linha LF — igual ao catalogo
// (scripts/lib/kit.mjs). Arquivo sem extensao (LICENSE) tambem sofre autocrlf no Windows.
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.zip', '.gz']);
const posix = (p) => String(p).split('\\').join('/');
const now = () => new Date().toISOString();

// --- projeto e lock ------------------------------------------------------------------------------

function findRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, '.claude', 'praxis.json'))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const ROOT = findRoot();
if (!ROOT) {
  console.error('praxis: este diretorio nao tem a semente do kit (.claude/praxis.json). Instale a semente primeiro.');
  process.exit(2);
}
if (existsSync(join(ROOT, 'scripts', 'lib', 'kit.mjs')) && existsSync(join(ROOT, 'catalog.json'))) {
  console.error('praxis: este repositorio e o catalogo, nao um projeto — nada a puxar aqui.');
  process.exit(2);
}

const LOCK_PATH = join(ROOT, '.claude', 'praxis.json');
const UPDATE_PATH = join(ROOT, '.claude', 'praxis.update.json');
const CHECK_PATH = join(ROOT, '.claude', 'praxis.check.json');
const MUTEX_PATH = join(ROOT, '.claude', 'praxis.lock');
const CACHE_ROOT = process.env.PRAXIS_CACHE_DIR || join(homedir(), '.claude', 'praxis', 'cache');

const readJson = (p, fallback = null) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; } };
const writeJson = (p, obj) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8'); };

function readLock() {
  const lock = readJson(LOCK_PATH);
  if (!lock || !lock.repo || !lock.version) { console.error('praxis: .claude/praxis.json invalido (precisa de repo e version).'); process.exit(1); }
  lock.tools ??= {};
  lock.pending ??= {};
  return lock;
}
const writeLock = (lock) => writeJson(LOCK_PATH, { ...lock, updatedAt: now() });

function hashContent(buf, file) {
  const text = !BINARY_EXT.has(extname(file).toLowerCase());
  const data = text ? Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8') : buf;
  return createHash('sha256').update(data).digest('hex');
}
const hashFile = (abs) => hashContent(readFileSync(abs), abs);

// --- mutex ----------------------------------------------------------------------------------------

function withMutex(fn) {
  const stale = 10 * 60 * 1000;
  if (existsSync(MUTEX_PATH)) {
    const m = readJson(MUTEX_PATH, {});
    if (m.at && Date.now() - Date.parse(m.at) < stale) {
      console.error(`praxis: outra sessao esta escrevendo (${MUTEX_PATH}, pid ${m.pid}). Tente de novo em instantes.`);
      process.exit(1);
    }
  }
  writeJson(MUTEX_PATH, { pid: process.pid, at: now() });
  const release = () => { try { unlinkSync(MUTEX_PATH); } catch { /* ignore */ } };
  process.on('exit', release); // process.exit() dentro de fn() nao passa pelo finally
  try { return fn(); } finally { release(); }
}

// --- cache do catalogo ----------------------------------------------------------------------------

function git(args, opts = {}) {
  const r = spawnSync('git', args, { encoding: 'utf8', timeout: opts.timeout ?? 120000, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) return { ok: false, out: '', err: r.error.message };
  return { ok: r.status === 0, out: r.stdout || '', err: r.stderr || '' };
}

const refFor = (lock, version) => (lock.ref && version === lock.version ? lock.ref : `v${version}`);
const cacheDir = (version, ref) => join(CACHE_ROOT, ref === `v${version}` ? version : `${version}-${ref.replace(/[^A-Za-z0-9._-]/g, '_')}`);

/** Garante o clone da versao no cache e devolve { dir, catalog }. Offline: so se ja estiver no cache. */
function ensureCache(lock, version) {
  const ref = refFor(lock, version);
  const dir = cacheDir(version, ref);
  if (!existsSync(join(dir, 'catalog.json'))) {
    if (process.env.PRAXIS_OFFLINE === '1') { console.error(`praxis: versao ${version} nao esta no cache e PRAXIS_OFFLINE=1.`); process.exit(1); }
    mkdirSync(dirname(dir), { recursive: true });
    const tmp = `${dir}.tmp-${process.pid}`;
    // core.longpaths: no Windows o limite de 260 caracteres derruba o checkout das fixtures de evals
    const r = git(['-c', 'core.longpaths=true', 'clone', '--quiet', '--depth', '1', '--branch', ref, lock.repo, tmp], { timeout: 180000 });
    if (!r.ok) {
      try { rmSync(tmp, { recursive: true, force: true }); } catch { /* */ }
      console.error(`praxis: nao consegui clonar ${lock.repo} (${ref}) para o cache.\n${r.err.trim()}\nSem rede? Rode depois: node .claude/praxis/praxis.mjs ${process.argv.slice(2).join(' ')}`);
      process.exit(1);
    }
    renameSync(tmp, dir);
  }
  const catalog = readJson(join(dir, 'catalog.json'));
  if (!catalog || !catalog.tools) { console.error(`praxis: catalogo invalido no cache (${dir}).`); process.exit(1); }
  return { dir, catalog };
}

// --- resolucao no catalogo ------------------------------------------------------------------------

function normalizeRef(ref) {
  ref = posix(ref).replace(/\/$/, '');
  const m = ref.match(/^(\.claude\/skills\/[^/]+)\/SKILL\.md$/);
  return m ? m[1] : ref;
}
function resolveTool(catalog, ref) {
  ref = normalizeRef(ref);
  if (catalog.tools[ref]) return ref;
  if (catalog.skills?.[ref]) return catalog.skills[ref];
  if (catalog.agents?.[ref]) return catalog.agents[ref];
  for (const [p, t] of Object.entries(catalog.tools)) if (t.files[ref]) return p;
  return null;
}
function closure(catalog, refs) {
  const out = new Set();
  const stack = [];
  for (const r of refs) {
    const p = resolveTool(catalog, r);
    if (!p) { console.error(`praxis: "${r}" nao existe no catalogo ${catalog.version}. Veja: node .claude/praxis/praxis.mjs list`); process.exit(1); }
    stack.push(p);
  }
  while (stack.length) {
    const p = stack.pop();
    if (out.has(p)) continue;
    out.add(p);
    for (const d of catalog.tools[p].depends ?? []) {
      const r = resolveTool(catalog, d);
      if (r && !out.has(r)) stack.push(r);
    }
  }
  return out;
}

// --- copia ----------------------------------------------------------------------------------------

function copyFromCache(cache, catalog, file, expectedSha) {
  const src = join(cache, file);
  if (!existsSync(src)) return { file, result: 'ausente-no-catalogo' };
  if (hashFile(src) !== expectedSha) return { file, result: 'hash-divergente' };
  const dst = join(ROOT, file);
  mkdirSync(dirname(dst), { recursive: true });
  if (posix(file) === '.claude/praxis/praxis.mjs') {
    // substitui a si mesmo por ultimo e de forma atomica
    const tmp = `${dst}.tmp-${process.pid}`;
    copyFileSync(src, tmp);
    renameSync(tmp, dst);
  } else {
    copyFileSync(src, dst);
  }
  return { file, result: 'copiado' };
}

function registerAdrInIndex(file) {
  const m = posix(file).match(/^docs\/adr\/(\d{4})-(.+)\.md$/);
  if (!m) return;
  const idx = join(ROOT, 'docs', 'adr', '0000-adr-index.md');
  if (!existsSync(idx)) return;
  let txt = readFileSync(idx, 'utf8');
  if (txt.includes(`[${m[1]}]`)) return;
  const content = readFileSync(join(ROOT, file), 'utf8');
  const title = (content.match(/^# ADR-\d{4}:\s*(.+)$/m) || [, m[2]])[1].trim();
  const date = (content.match(/\*\*Data:\*\*\s*(\S+)/) || [, '—'])[1];
  const row = `| [${m[1]}](${basename(file)}) | ${title} | Aceito | ${date} |\n`;
  const marker = '| <!-- NNNN -->';
  txt = txt.includes(marker) ? txt.replace(marker, row + marker) : txt.replace(/\n*$/, '\n' + row);
  writeFileSync(idx, txt, 'utf8');
}

/** Puxa as ferramentas (fecho) da versao do lock. Nao sobrescreve arquivo do projeto que nao esta no lock. */
function pull(lock, refs, { quiet = false } = {}) {
  const { dir: cache, catalog } = ensureCache(lock, lock.version);
  const tools = closure(catalog, refs);
  const summary = { copiados: [], mantidos: [], erros: [] };
  // um arquivo pode pertencer a mais de uma ferramenta (grupo + asset): "do kit" e qualquer entrada do lock
  const tracked = new Set();
  for (const t of Object.values(lock.tools)) for (const f of Object.keys(t.files)) tracked.add(f);
  const done = new Set();
  for (const p of tools) {
    const t = catalog.tools[p];
    const entry = lock.tools[p] ?? { kind: t.kind, files: {} };
    for (const [file, sha] of Object.entries(t.files)) {
      const abs = join(ROOT, file);
      if (existsSync(abs) && !tracked.has(file) && !done.has(file)) {
        // arquivo do projeto com o mesmo caminho: e dele, fica
        summary.mantidos.push(file);
        continue;
      }
      // ja instalado: mantem o hash de origem registrado (e a base para detectar personalizacao)
      if (existsSync(abs)) { if (!(file in entry.files)) entry.files[file] = sha; continue; }
      const r = copyFromCache(cache, catalog, file, sha);
      if (r.result === 'copiado') { entry.files[file] = sha; tracked.add(file); done.add(file); summary.copiados.push(file); registerAdrInIndex(file); }
      else summary.erros.push(`${file}: ${r.result}`);
    }
    entry.kind = t.kind;
    lock.tools[p] = entry;
  }
  writeLock(lock);
  ledgerAuto(`${now()} | turn | praxis add: ${[...refs].join(', ')} (${summary.copiados.length} arquivos) | (auto)`);
  if (!quiet) {
    console.log(`praxis ${catalog.version}: ${tools.size} ferramenta(s), ${summary.copiados.length} arquivo(s) copiado(s)` + (summary.mantidos.length ? `, ${summary.mantidos.length} do projeto mantido(s)` : ''));
    for (const e of summary.erros) console.error(`  ERRO ${e}`);
  }
  if (summary.erros.length) process.exit(1);
  return summary;
}

function ledgerAuto(line) {
  const p = join(ROOT, 'docs', 'project', 'learnings', 'ledger-auto.md');
  try {
    const MARK = '<!-- LEDGER:START -->';
    if (!existsSync(p)) {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, `# Ledger automatico (local, gitignored)\n\n${MARK}\n`, 'utf8');
    }
    let txt = readFileSync(p, 'utf8');
    if (!txt.includes(MARK)) txt += `\n${MARK}\n`;
    writeFileSync(p, txt.replace(/\s*$/, '') + '\n' + line + '\n', 'utf8');
  } catch { /* o ledger e rede, nao gate */ }
}

function ensureGitignore() {
  const p = join(ROOT, '.gitignore');
  const entries = ['.claude/praxis.lock', '.claude/praxis.update.json', '.claude/praxis.check.json', '.claude/hooks/.capture-cursor.json', 'docs/project/state.md', 'docs/project/learnings/ledger-auto.md', '.claude/settings.local.json'];
  let txt = existsSync(p) ? readFileSync(p, 'utf8') : '';
  const missing = entries.filter((e) => !txt.split(/\r?\n/).some((l) => l.trim() === e));
  if (!missing.length) return;
  txt = txt.replace(/\s*$/, '') + (txt.trim() ? '\n\n' : '') + '# Praxis — estado local (nao versionar)\n' + missing.join('\n') + '\n';
  writeFileSync(p, txt, 'utf8');
}

// --- comandos -------------------------------------------------------------------------------------

function cmdInit(lock) {
  return withMutex(() => {
    const { dir: cache, catalog } = ensureCache(lock, lock.version);
    if (catalog.version !== lock.version) {
      // ref de desenvolvimento (branch): o lock passa a seguir a versao do catalogo clonado
      lock.version = catalog.version;
    }
    for (const seed of catalog.seeds ?? []) {
      const dst = join(ROOT, seed);
      if (existsSync(dst)) continue;
      const src = join(cache, seed);
      if (!existsSync(src)) continue;
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
    }
    const refs = [...(catalog.core ?? []), ...(catalog.seed ?? [])];
    pull(lock, refs, { quiet: true });
    ensureGitignore();
    console.log(`praxis ${lock.version}: nucleo instalado (${Object.keys(lock.tools).length} ferramentas no lock).`);
  });
}

function cmdAdd(lock, args) {
  const refs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--module') {
      const { catalog } = ensureCache(lock, lock.version);
      const mod = catalog.modules?.[args[++i]];
      if (!mod) { console.error(`praxis: modulo "${args[i]}" nao existe. Modulos: ${Object.keys(catalog.modules ?? {}).join(', ')}`); process.exit(2); }
      refs.push(...mod);
    } else refs.push(args[i]);
  }
  if (!refs.length) { console.error('uso: praxis.mjs add <skill|agent|caminho>... | --module <nome>'); process.exit(2); }
  return withMutex(() => pull(lock, refs));
}

function modifiedFiles(lock) {
  const out = [];
  for (const [tool, t] of Object.entries(lock.tools)) {
    for (const [file, sha] of Object.entries(t.files)) {
      const abs = join(ROOT, file);
      if (!existsSync(abs)) out.push({ tool, file, estado: 'removido' });
      else if (hashFile(abs) !== sha) out.push({ tool, file, estado: 'personalizado' });
    }
  }
  return out;
}

function cmdList(lock, args) {
  const { catalog } = ensureCache(lock, lock.version);
  const installed = new Set(Object.keys(lock.tools));
  const rows = [];
  for (const [name, p] of Object.entries(catalog.skills ?? {})) rows.push({ tipo: 'skill', nome: `/${name}`, caminho: p, instalada: installed.has(p), descricao: catalog.tools[p]?.description ?? '' });
  for (const [name, p] of Object.entries(catalog.agents ?? {})) rows.push({ tipo: 'agent', nome: `@${name}`, caminho: p, instalada: installed.has(p), descricao: catalog.tools[p]?.description ?? '' });
  if (args.includes('--json')) { console.log(JSON.stringify({ version: catalog.version, modules: catalog.modules, tools: rows }, null, 2)); return; }
  console.log(`catalogo ${catalog.version} — [x] = no projeto`);
  for (const r of rows) console.log(`  [${r.instalada ? 'x' : ' '}] ${r.nome.padEnd(28)} ${r.descricao.slice(0, 90)}`);
  console.log('modulos: ' + Object.entries(catalog.modules ?? {}).map(([k, v]) => `${k} (${v.length})`).join(' · '));
}

function cmdStatus(lock, args) {
  const mods = modifiedFiles(lock);
  const update = readJson(UPDATE_PATH);
  const check = readJson(CHECK_PATH);
  const st = {
    version: lock.version, ref: lock.ref ?? null, pin: lock.pin ?? null, repo: lock.repo,
    ferramentas: Object.keys(lock.tools).length,
    personalizados: mods.filter((m) => m.estado === 'personalizado').map((m) => m.file),
    removidos: mods.filter((m) => m.estado === 'removido').map((m) => m.file),
    pendentes: lock.pending,
    atualizacao: update ? { version: update.version, major: update.major, substituir: update.replace.length, manter: update.keep.length, novos: update.add.length } : null,
    ultimaChecagem: check?.at ?? null,
  };
  if (args.includes('--json')) { console.log(JSON.stringify(st, null, 2)); return; }
  console.log(`praxis ${st.version}${st.ref ? ` (ref ${st.ref})` : ''}${st.pin ? ` · pino ${st.pin}` : ''} · ${st.ferramentas} ferramentas · ultima checagem: ${st.ultimaChecagem ?? 'nunca'}`);
  if (st.personalizados.length) { console.log('personalizados (ficam como estao nas atualizacoes):'); for (const f of st.personalizados) console.log(`  ${f}`); }
  if (st.removidos.length) { console.log('do kit, apagados no projeto:'); for (const f of st.removidos) console.log(`  ${f}`); }
  if (Object.keys(st.pendentes).length) { console.log('pendentes de merge (versao nova disponivel, arquivo personalizado):'); for (const [f, v] of Object.entries(st.pendentes)) console.log(`  ${f} → ${v}`); }
  if (st.atualizacao) console.log(`atualizacao pronta: ${st.atualizacao.version}${st.atualizacao.major ? ' (MAJOR — apply --major)' : ''} — ${st.atualizacao.substituir} a substituir, ${st.atualizacao.manter} personalizados mantidos, ${st.atualizacao.novos} novos`);
}

const semver = (v) => v.split('.').map(Number);
const cmp = (a, b) => { const [x, y] = [semver(a), semver(b)]; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

function cmdCheck(lock, args) {
  if (process.env.PRAXIS_OFFLINE === '1' || process.env.PRAXIS_DRIVER === '1') return;
  const check = readJson(CHECK_PATH, {});
  if (!args.includes('--force') && check.at && Date.now() - Date.parse(check.at) < 24 * 3600 * 1000) return;
  writeJson(CHECK_PATH, { at: now() });
  const r = git(['ls-remote', '--tags', '--refs', lock.repo], { timeout: 20000 });
  if (!r.ok) return; // sem rede: silencio, tenta amanha
  const tags = r.out.split(/\r?\n/).map((l) => l.split('\t')[1]).filter(Boolean)
    .map((ref) => ref.replace('refs/tags/', '')).filter((t) => /^v\d+\.\d+\.\d+$/.test(t)).map((t) => t.slice(1));
  const candidates = tags.filter((v) => cmp(v, lock.version) > 0 && (!lock.pin || cmp(v, lock.pin) <= 0)).sort(cmp);
  if (!candidates.length) { try { unlinkSync(UPDATE_PATH); } catch { /* */ } return; }
  const target = candidates[candidates.length - 1];
  const major = semver(target)[0] !== semver(lock.version)[0];
  const { catalog: next } = ensureCache({ ...lock, ref: undefined }, target);
  const plan = planUpdate(lock, next);
  writeJson(UPDATE_PATH, { version: target, major, at: now(), ...plan });
  console.log(`praxis: atualizacao ${lock.version} → ${target}${major ? ' (MAJOR)' : ''} pronta no cache: ${plan.replace.length} a substituir, ${plan.keep.length} personalizados mantidos, ${plan.add.length} novos.`);
}

function planUpdate(lock, next) {
  const replace = [], keep = [], add = [], removed = [], same = [];
  const tools = closure(next, Object.keys(lock.tools).filter((p) => resolveTool(next, p)));
  for (const p of tools) {
    const t = next.tools[p];
    const entry = lock.tools[p] ?? { files: {} };
    for (const [file, sha] of Object.entries(t.files)) {
      const abs = join(ROOT, file);
      const old = entry.files[file];
      if (old === undefined) { if (!existsSync(abs)) add.push(file); continue; }
      if (!existsSync(abs)) { removed.push(file); continue; }
      const cur = hashFile(abs);
      if (cur === sha) same.push(file);
      else if (cur === old) replace.push(file);
      else keep.push(file);
    }
  }
  return { replace, keep, add, removed, same, tools: [...tools] };
}

function wipSlices() {
  const specs = join(ROOT, 'docs', 'specs');
  const out = [];
  if (!existsSync(specs)) return out;
  for (const d of readdirSync(specs)) {
    const t = join(specs, d, 'tasks.md');
    if (!existsSync(t)) continue;
    for (const line of readFileSync(t, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\|\s*(U[\w.]+)\s*\|\s*`?WIP`?\s*\|/);
      if (m) out.push(`${d}:${m[1]}`);
    }
  }
  return out;
}

function cmdApply(lock, args) {
  if (process.env.PRAXIS_DRIVER === '1') { console.error('praxis: apply nao roda dentro do loop-driver.'); process.exit(1); }
  const update = readJson(UPDATE_PATH);
  if (!update) { console.log('praxis: nenhuma atualizacao pronta (rode check).'); return; }
  if (update.major && !args.includes('--major')) { console.error(`praxis: ${update.version} e MAJOR — leia o changelog e rode apply --major.`); process.exit(1); }
  const wip = wipSlices();
  if (wip.length && !args.includes('--force')) { console.error(`praxis: fatia WIP (${wip.join(', ')}) — atualizacao so com o loop parado.`); process.exit(1); }
  return withMutex(() => {
    const { dir: cache, catalog: next } = ensureCache({ ...lock, ref: undefined }, update.version);
    const plan = planUpdate(lock, next); // recalculado agora: o projeto pode ter mudado desde o check
    const errors = [];
    const newLock = { ...lock, version: update.version, ref: undefined, tools: {}, pending: { ...lock.pending } };
    for (const p of plan.tools) {
      const t = next.tools[p];
      const entry = { kind: t.kind, files: {} };
      const old = lock.tools[p]?.files ?? {};
      for (const [file, sha] of Object.entries(t.files)) {
        if (plan.keep.includes(file)) { entry.files[file] = old[file]; newLock.pending[file] = update.version; continue; }
        if (plan.removed.includes(file)) { entry.files[file] = old[file]; continue; }
        if (plan.same.includes(file)) { entry.files[file] = sha; delete newLock.pending[file]; continue; }
        if (file === '.claude/praxis/praxis.mjs') { entry.files[file] = sha; continue; } // por ultimo
        const r = copyFromCache(cache, next, file, sha);
        if (r.result === 'copiado') { entry.files[file] = sha; delete newLock.pending[file]; registerAdrInIndex(file); }
        else { errors.push(`${file}: ${r.result}`); entry.files[file] = old[file] ?? sha; }
      }
      newLock.tools[p] = entry;
    }
    for (const [p, t] of Object.entries(lock.tools)) if (!newLock.tools[p]) newLock.tools[p] = t; // removida do catalogo: fica
    if (!plan.keep.includes('.claude/praxis/praxis.mjs') && next.tools['.claude/praxis']?.files['.claude/praxis/praxis.mjs']) {
      const r = copyFromCache(cache, next, '.claude/praxis/praxis.mjs', next.tools['.claude/praxis'].files['.claude/praxis/praxis.mjs']);
      if (r.result !== 'copiado') errors.push(`praxis.mjs: ${r.result}`);
    }
    writeLock(newLock);
    try { unlinkSync(UPDATE_PATH); } catch { /* */ }
    ledgerAuto(`${now()} | turn | praxis apply: ${lock.version} → ${update.version} (${plan.replace.length + plan.add.length} arquivos; ${plan.keep.length} personalizados mantidos) | (auto)`);
    console.log(`praxis: catalogo ${lock.version} → ${update.version}: ${plan.replace.length} substituido(s), ${plan.add.length} novo(s), ${plan.keep.length} personalizado(s) mantido(s)${plan.removed.length ? `, ${plan.removed.length} apagado(s) no projeto deixados assim` : ''}.`);
    for (const f of plan.keep) console.log(`  mantido (personalizado): ${f} — diff: node .claude/praxis/praxis.mjs diff ${f}`);
    for (const e of errors) console.error(`  ERRO ${e}`);
    if (errors.length) process.exit(1);
  });
}

function cmdDiff(lock, args) {
  const ref = args[0];
  if (!ref) { console.error('uso: praxis.mjs diff <ferramenta|arquivo>'); process.exit(2); }
  const pendingVersion = lock.pending[posix(ref)];
  const version = pendingVersion ?? readJson(UPDATE_PATH)?.version ?? lock.version;
  const { dir: cache, catalog } = ensureCache(version === lock.version ? lock : { ...lock, ref: undefined }, version);
  const tool = resolveTool(catalog, ref);
  if (!tool) { console.error(`praxis: "${ref}" nao existe no catalogo ${version}.`); process.exit(1); }
  const files = catalog.tools[tool].files[posix(ref)] ? [posix(ref)] : Object.keys(catalog.tools[tool].files);
  for (const f of files) {
    const local = join(ROOT, f);
    if (!existsSync(local)) { console.log(`--- ${f}: nao existe no projeto`); continue; }
    const r = spawnSync('git', ['diff', '--no-index', '--', local, join(cache, f)], { encoding: 'utf8' });
    // o git imprime caminhos absolutos entre aspas, com as barras invertidas dobradas: normaliza para leitura
    const pathRe = (p) => new RegExp(p.split(/[\\/]+/).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\\\/]+'), 'g');
    const out = (r.stdout || '').replace(pathRe(cache), `<catalogo ${version}>`).replace(pathRe(ROOT), '<projeto>');
    console.log(out.trim() ? out : `${f}: identico ao catalogo ${version}`);
  }
}

// --- main -----------------------------------------------------------------------------------------

const [cmd, ...args] = process.argv.slice(2);
const lock = readLock();
switch (cmd) {
  case 'init': cmdInit(lock); break;
  case 'add': cmdAdd(lock, args); break;
  case 'list': cmdList(lock, args); break;
  case 'status': cmdStatus(lock, args); break;
  case 'check': cmdCheck(lock, args); break;
  case 'apply': cmdApply(lock, args); break;
  case 'diff': cmdDiff(lock, args); break;
  default:
    console.error('uso: node .claude/praxis/praxis.mjs <init|add|list|status|check|apply|diff> [args]');
    process.exit(2);
}
