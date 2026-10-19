#!/usr/bin/env node
// deps-audit.mjs — Vulnerabilidade em dependencia de TERCEIROS, por delta contra um baseline.
//
// Por que existe: os check agents olham o codigo que o projeto escreve. Dependencia vulneravel nao
// aparece em build, teste, typecheck nem lint — passa por todos os gates sem produzir sinal. E
// dependencia nova so entra por um manifesto: o /execute roda este script quando uma fatia toca um
// manifesto (package.json, *.csproj, requirements.txt...), que e o unico momento em que o resultado muda.
//
// Por que delta e nao absoluto: o projeto ja pode ter achados abertos. Um gate que reclama do passado
// em toda execucao treina o time a ignora-lo. O baseline registra o conhecido; o script so fala do que
// ENTROU depois. Aceitar um achado (as vezes nao ha versao corrigida) e decisao humana: --update-baseline.
//
// Ecossistemas: npm (package-lock.json), pnpm (pnpm-lock.yaml), .NET (*.sln / *.csproj) e Python
// (requirements*.txt / pyproject.toml, via pip-audit se instalado). Os demais (yarn, Go, Rust, Ruby,
// PHP) sao reportados como NAO VERIFICADO, com a ferramenta sugerida — nunca contados como limpos.
// Os audits consultam a rede (base de advisories de cada ecossistema).
//
// Uso:
//   node .claude/scripts/deps-audit.mjs [path-do-projeto] [--update-baseline] [--dry-run] [--json]
//   --dry-run: so le e reporta, nunca grava o baseline (uso do /verify-all, que e read-only)
//
// Baseline: docs/project/security/deps-baseline.json (versionado). Na primeira execucao, sem baseline,
// o estado atual vira o baseline e o script sai 0 — desde que todo ecossistema encontrado tenha sido
// verificado (rede ou ferramenta ausente adia a criacao). Ao atualizar, as chaves de um ecossistema
// NAO VERIFICADO nesta execucao ficam como estavam: falta de rede nao apaga nem aceita achado.
//
// Exit codes: 0 nada novo · 1 achado novo desde o baseline · 2 falha de execucao do proprio script

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const ROOT = resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
const BASELINE = join(ROOT, 'docs', 'project', 'security', 'deps-baseline.json');
const SKIP = new Set(['node_modules', '.git', 'bin', 'obj', 'dist', 'build', '.venv', 'venv', '.next']);

function run(cmd, cmdArgs, cwd) {
  // No Windows o shell e necessario para os shims .cmd (npm, pnpm); com ele, argumento com espaco
  // (ex.: caminho "C:\Meus Projetos\app.sln") precisa de aspas para nao virar dois argumentos.
  const shell = process.platform === 'win32';
  const quoted = shell ? cmdArgs.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)) : cmdArgs;
  const r = spawnSync(cmd, quoted, {
    cwd, encoding: 'utf8', shell, maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

const has = (cmd) => { const r = run(cmd, ['--version'], ROOT); return !r.error && r.status === 0; };

// Lista arquivos ate 3 niveis, sem pastas de build/dependencia.
function findFiles(dir, test, depth = 0, out = []) {
  if (depth > 3) return out;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) findFiles(join(dir, e.name), test, depth + 1, out); }
    else if (test(e.name)) out.push(join(dir, e.name));
  }
  return out;
}

const relPath = (p) => relative(ROOT, p).split('\\').join('/') || '.';
const sev = (s) => String(s || 'unknown').toLowerCase();
const parse = (txt) => { try { return JSON.parse(txt); } catch { return null; } };

// --- auditores: cada um devolve { findings: [...] } ou { unverified: motivo } ----------------------

function auditNpm(lock) {
  const dir = dirname(lock);
  if (!has('npm')) return { unverified: 'npm nao encontrado' };
  const r = run('npm', ['audit', '--json'], dir);
  const data = parse(r.stdout);
  if (!data || !data.vulnerabilities) return { unverified: `npm audit falhou: ${(r.stderr || r.stdout).trim().split('\n')[0]}` };
  const findings = [];
  for (const [name, v] of Object.entries(data.vulnerabilities)) {
    for (const via of v.via || []) {
      if (typeof via !== 'object') continue; // via em string = vem de outra dependencia ja listada
      findings.push({ ecosystem: 'npm', where: relPath(dir), package: name, id: via.url || String(via.source), severity: sev(via.severity), title: via.title || '' });
    }
  }
  return { findings };
}

function auditPnpm(lock) {
  const dir = dirname(lock);
  if (!has('pnpm')) return { unverified: 'pnpm nao encontrado' };
  const r = run('pnpm', ['audit', '--json'], dir);
  const data = parse(r.stdout);
  if (!data || !data.advisories) return { unverified: `pnpm audit falhou: ${(r.stderr || r.stdout).trim().split('\n')[0]}` };
  const findings = Object.values(data.advisories).map((a) => ({
    ecosystem: 'pnpm', where: relPath(dir), package: a.module_name, id: a.url || String(a.id), severity: sev(a.severity), title: a.title || '',
  }));
  return { findings };
}

function auditDotnet(target) {
  if (!has('dotnet')) return { unverified: 'dotnet nao encontrado' };
  const r = run('dotnet', ['list', target, 'package', '--vulnerable', '--include-transitive', '--format', 'json'], ROOT);
  const data = parse(r.stdout);
  if (!data || !Array.isArray(data.projects)) return { unverified: `dotnet list --vulnerable falhou (precisa de restore e SDK 7+): ${(r.stderr || r.stdout).trim().split('\n')[0]}` };
  const findings = [];
  for (const proj of data.projects) {
    for (const fw of proj.frameworks || []) {
      for (const pkg of [...(fw.topLevelPackages || []), ...(fw.transitivePackages || [])]) {
        for (const v of pkg.vulnerabilities || []) {
          findings.push({ ecosystem: 'nuget', where: relPath(proj.path || target), package: pkg.id, id: v.advisoryurl || `${pkg.id}@${pkg.resolvedVersion}`, severity: sev(v.severity), title: `${pkg.id} ${pkg.resolvedVersion}` });
        }
      }
    }
  }
  return { findings };
}

function auditPython(manifest) {
  if (!has('pip-audit')) return { unverified: 'pip-audit nao instalado (pip install pip-audit)' };
  const isReq = /requirements.*\.txt$/.test(manifest);
  const r = run('pip-audit', isReq ? ['-r', manifest, '-f', 'json'] : ['-f', 'json'], dirname(manifest));
  const data = parse(r.stdout);
  const deps = Array.isArray(data) ? data : data?.dependencies;
  if (!Array.isArray(deps)) return { unverified: `pip-audit falhou: ${(r.stderr || r.stdout).trim().split('\n')[0]}` };
  const findings = [];
  for (const d of deps) {
    for (const v of d.vulns || []) {
      findings.push({ ecosystem: 'pypi', where: relPath(manifest), package: d.name, id: v.id, severity: 'unknown', title: `${d.name} ${d.version}` });
    }
  }
  return { findings };
}

const UNSUPPORTED = [
  [/^yarn\.lock$/, 'yarn', 'yarn npm audit (Berry) ou yarn audit (v1)'],
  [/^go\.mod$/, 'go', 'govulncheck'],
  [/^Cargo\.lock$/, 'rust', 'cargo audit'],
  [/^Gemfile\.lock$/, 'ruby', 'bundler-audit'],
  [/^composer\.lock$/, 'php', 'composer audit'],
];

// --- coleta ----------------------------------------------------------------------------------------

function collect() {
  const findings = [];
  const unverified = [];
  const audited = [];
  const failedEcos = new Set();
  const add = (label, eco, res) => {
    audited.push(label);
    if (res.unverified) { unverified.push(`${label}: ${res.unverified}`); failedEcos.add(eco); }
    else findings.push(...res.findings);
  };

  for (const f of findFiles(ROOT, (n) => n === 'package-lock.json')) add(`npm ${relPath(dirname(f))}`, 'npm', auditNpm(f));
  for (const f of findFiles(ROOT, (n) => n === 'pnpm-lock.yaml')) add(`pnpm ${relPath(dirname(f))}`, 'pnpm', auditPnpm(f));

  const slns = findFiles(ROOT, (n) => n.endsWith('.sln') || n.endsWith('.slnx'));
  const projs = slns.length ? slns : findFiles(ROOT, (n) => n.endsWith('.csproj') || n.endsWith('.fsproj'));
  for (const f of projs) add(`.NET ${relPath(f)}`, 'nuget', auditDotnet(f));

  const py = findFiles(ROOT, (n) => /^requirements.*\.txt$/.test(n) || n === 'pyproject.toml');
  for (const f of py) add(`Python ${relPath(f)}`, 'pypi', auditPython(f));

  for (const [re, eco, tool] of UNSUPPORTED) {
    for (const f of findFiles(ROOT, (n) => re.test(n))) unverified.push(`${eco} ${relPath(f)}: o kit nao audita este ecossistema — rode ${tool}`);
  }
  return { findings, unverified, audited, failedEcos };
}

const keyOf = (f) => `${f.ecosystem}|${f.package}|${f.id}`;

function main() {
  if (!existsSync(ROOT)) { console.error(`deps-audit: caminho inexistente: ${ROOT}`); process.exit(2); }
  const { findings, unverified, audited, failedEcos } = collect();

  const uniq = new Map(findings.map((f) => [keyOf(f), f]));
  const current = [...uniq.values()];
  const baseline = existsSync(BASELINE) ? parse(readFileSync(BASELINE, 'utf8')) : null;
  const known = new Set(baseline?.findings || []);
  const fresh = baseline ? current.filter((f) => !known.has(keyOf(f))) : [];
  const ecoOf = (k) => k.split('|')[0];
  const kept = [...known].filter((k) => failedEcos.has(ecoOf(k))); // nao verificado agora: fica como estava
  const fixed = baseline ? [...known].filter((k) => !uniq.has(k) && !failedEcos.has(ecoOf(k))) : [];

  const adiado = !baseline && failedEcos.size > 0; // baseline parcial faria achado antigo voltar como NOVO
  const write = !flags.has('--dry-run') && !adiado && (!baseline || flags.has('--update-baseline'));
  if (write) {
    mkdirSync(dirname(BASELINE), { recursive: true });
    const keys = [...new Set([...uniq.keys(), ...kept])].sort();
    writeFileSync(BASELINE, JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), findings: keys }, null, 2) + '\n', 'utf8');
  }

  const result = {
    audited, unverified,
    total: current.length,
    baseline: baseline ? (write ? 'atualizado' : 'existente') : (write ? 'criado agora' : adiado ? `adiado (nao verificado: ${[...failedEcos].join(', ')})` : 'ausente (dry-run: nao gravado)'),
    new: fresh, resolvedSinceBaseline: fixed.length,
  };

  if (flags.has('--json')) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    console.log(`deps-audit: ${audited.length ? audited.join(' · ') : 'nenhum manifesto suportado encontrado'}`);
    console.log(`  achados atuais: ${current.length} · baseline: ${result.baseline}` + (baseline ? ` · resolvidos desde o baseline: ${fixed.length}` : ''));
    for (const u of unverified) console.log(`  NAO VERIFICADO — ${u}`);
    if (fresh.length) {
      console.log(`  NOVOS desde o baseline (${fresh.length}):`);
      for (const f of fresh) console.log(`    [${f.severity}] ${f.ecosystem} ${f.package} — ${f.title} (${f.id}) em ${f.where}`);
      console.log('  Corrigir (versao corrigida) ou aceitar conscientemente com --update-baseline.');
    }
  }
  process.exit(fresh.length && !write ? 1 : 0);
}

main();
