#!/usr/bin/env node
// generate-index.mjs — Gera docs/kit-index.md, docs/kit-index.json e catalog.json a partir dos
// frontmatters e do grafo de dependencias (ADR-0009).
//
// Uso:
//   node scripts/generate-index.mjs          # (re)gera os arquivos
//   node scripts/generate-index.mjs --check  # falha (exit 1) se os arquivos estiverem desatualizados
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, collectKit, collectCatalog } from './lib/kit.mjs';

const MD_PATH = join(ROOT, 'docs', 'kit-index.md');
const JSON_PATH = join(ROOT, 'docs', 'kit-index.json');
const CATALOG_PATH = join(ROOT, 'catalog.json');

function buildCatalog() {
  const c = collectCatalog();
  // `cites` e so para o validate-kit; o catalogo publica o que o praxis.mjs precisa
  const tools = Object.fromEntries(Object.entries(c.tools).map(([p, t]) => {
    const { cites, ...rest } = t;
    return [p, rest];
  }));
  return JSON.stringify({ ...c, tools }, null, 2) + '\n';
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function buildMarkdown({ skills, agents }) {
  const out = [];
  out.push('# Kit Index - Praxis', '');
  out.push('> Inventario completo de skills e agents do kit. Gerado automaticamente por `node scripts/generate-index.mjs` — nao edite a mao.');
  out.push('> O agente Praxis consulta este indice para saber a qual dominio cada item pertence.', '');
  out.push('---', '');

  out.push(`## Skills (${skills.length})`, '');
  out.push('| Skill | Path | Descricao | Deps |', '|-------|------|-----------|------|');
  for (const s of skills) {
    out.push(`| \`/${s.name}\` | \`${s.path}\` | ${cell(s.description)} | ${s.depends.length || '-'} |`);
  }
  out.push('');

  out.push(`## Agents (${agents.length})`, '');
  const domains = [...new Set(agents.map((a) => a.domain))];
  for (const d of domains) {
    const group = agents.filter((a) => a.domain === d);
    out.push(`### ${d} (${group.length})`, '');
    out.push('| Agent | Path | Descricao | Deps |', '|-------|------|-----------|------|');
    for (const a of group) {
      out.push(`| \`@${a.name}\` | \`${a.path}\` | ${cell(a.description)} | ${a.depends.length || '-'} |`);
    }
    out.push('');
  }

  out.push('---', '', '## Dependencias detalhadas', '');
  out.push('Lista expandida apenas para items com `depends:` declarado.');
  out.push('Items omitidos sao folha (zero dependencias no kit).', '');
  const withDeps = [
    ...skills.filter((s) => s.depends.length).map((s) => ({ label: `/${s.name}`, depends: s.depends })),
    ...agents.filter((a) => a.depends.length).map((a) => ({ label: `@${a.name}`, depends: a.depends })),
  ];
  for (const item of withDeps) {
    out.push(`### ${item.label}`, '');
    for (const dep of item.depends) out.push(`- \`${dep}\``);
    out.push('');
  }
  return out.join('\n');
}

function buildJson({ skills, agents }) {
  const model = {
    skills: skills.map(({ name, path, description, domain, depends }) => ({ name, path, description, domain, depends })),
    agents: agents.map(({ name, domain, path, description, depends }) => ({ name, domain, path, description, depends })),
  };
  return JSON.stringify(model, null, 2) + '\n';
}

const kit = collectKit();
const md = buildMarkdown(kit);
const json = buildJson(kit);
const catalog = buildCatalog();

if (process.argv.includes('--check')) {
  const stale = [
    [MD_PATH, md],
    [JSON_PATH, json],
    [CATALOG_PATH, catalog],
  ].filter(([p, content]) => !existsSync(p) || readFileSync(p, 'utf8').replace(/\r\n/g, '\n') !== content);
  if (stale.length) {
    console.error('Indice/catalogo desatualizado. Rode: node scripts/generate-index.mjs');
    for (const [p] of stale) console.error(`  - ${p.slice(ROOT.length + 1)}`);
    process.exit(1);
  }
  console.log(`Indice em dia (${kit.skills.length} skills, ${kit.agents.length} agents).`);
} else {
  writeFileSync(MD_PATH, md);
  writeFileSync(JSON_PATH, json);
  writeFileSync(CATALOG_PATH, catalog);
  console.log(`Indice e catalogo gerados: ${kit.skills.length} skills, ${kit.agents.length} agents.`);
}
