#!/usr/bin/env node
// build-seed.mjs — Gera a pasta seed/ (ADR-0009): o minimo que um projeto instala para o primeiro /start.
//
// Uso:
//   node scripts/build-seed.mjs          # (re)gera seed/
//   node scripts/build-seed.mjs --check  # falha (exit 1) se seed/ estiver desatualizada
//
// A semente e copia de arquivos do catalogo (nunca editada a mao) mais o lock inicial, ja com os
// arquivos da semente registrados — assim o `praxis.mjs init` os trata como do kit, nao do projeto.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { ROOT, collectCatalog, resolveTool, walkFiles } from './lib/kit.mjs';

const SEED = join(ROOT, 'seed');
const catalog = collectCatalog();
const posix = (p) => p.split('\\').join('/');

const files = new Map(); // caminho no projeto -> conteudo (Buffer)
const lockTools = {};
for (const ref of [...catalog.seed]) {
  const p = resolveTool(catalog, ref);
  if (!p) throw new Error(`semente: ${ref} nao esta no catalogo`);
  const t = catalog.tools[p];
  lockTools[p] = { kind: t.kind, files: { ...t.files } };
  for (const f of Object.keys(t.files)) files.set(f, readFileSync(join(ROOT, f)));
}
for (const f of catalog.seedProject) files.set(f, readFileSync(join(ROOT, f)));

const lock = {
  repo: catalog.repo,
  version: catalog.version,
  pin: null,
  tools: lockTools,
  pending: {},
};
files.set('.claude/praxis.json', Buffer.from(JSON.stringify(lock, null, 2) + '\n', 'utf8'));

const manifest = JSON.parse(readFileSync(join(ROOT, '.claude', 'hooks', 'hooks.manifest.json'), 'utf8'));
const gitignore = [
  '# Claude Code local settings (not shared)',
  '.claude/settings.local.json',
  '',
  '# Praxis — estado local gerado pelos hooks e pelo praxis.mjs (nao versionar)',
  ...manifest.gitignore,
  '',
].join('\n');
files.set('.gitignore', Buffer.from(gitignore, 'utf8'));

if (process.argv.includes('--check')) {
  const stale = [];
  for (const [f, content] of files) {
    const p = join(SEED, f);
    if (!existsSync(p) || Buffer.compare(readFileSync(p), content) !== 0) stale.push(f);
  }
  const extra = walkFiles(SEED).map((f) => posix(relative(SEED, f))).filter((f) => !files.has(f));
  if (stale.length || extra.length) {
    console.error('seed/ desatualizada. Rode: node scripts/build-seed.mjs');
    for (const f of stale) console.error(`  - ${f}`);
    for (const f of extra) console.error(`  - ${f} (sobrando)`);
    process.exit(1);
  }
  console.log(`seed/ em dia (${files.size} arquivos, catalogo ${catalog.version}).`);
} else {
  rmSync(SEED, { recursive: true, force: true });
  for (const [f, content] of files) {
    const p = join(SEED, f);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  console.log(`seed/ gerada: ${files.size} arquivos (catalogo ${catalog.version}).`);
}
