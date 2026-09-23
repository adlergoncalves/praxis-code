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
//   - caminhos pessoais/absolutos versionados (ex.: C:\Users\...)
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, collectKit } from './lib/kit.mjs';

const errors = [];
const fail = (msg) => errors.push(msg);

const { skills, agents } = collectKit();

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
  fail(`docs/project/learnings/ledger.md: ${ledgerEntries.length} entrada(s) apos LEDGER:START — o template deve ir vazio (desligue os hooks localmente: .claude/settings.local.json com {"disableAllHooks": true})`);
}

// Caminhos pessoais/absolutos
const PERSONAL = /[A-Za-z]:\\\\?Users\\\\?|\/Users\/[a-z]|\/home\/[a-z]+\//;
const SKIP_DIRS = new Set(['.git', 'node_modules']);
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(md|json|mjs|js|yml|yaml)$/.test(entry)) {
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
