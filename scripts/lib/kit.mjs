// Helpers compartilhados pelos scripts de manutencao do kit (generate-index, validate-kit).
// Zero dependencias — so Node >= 18.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

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

const rel = (...p) => join(...p).split('\\').join('/');

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
