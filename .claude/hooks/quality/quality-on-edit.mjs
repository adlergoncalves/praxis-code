#!/usr/bin/env node
// quality-on-edit.mjs — hook OPT-IN de qualidade (PostToolUse Write|Edit|MultiEdit).
//
// Por que existe: no loop autonomo ninguem le cada edicao. Formatar, lintar e rodar o teste do
// arquivo editado NO INSTANTE da edicao pega o erro enquanto o contexto ainda esta fresco — em vez
// de descobrir tudo junto no gate da fatia.
//
// Por que opt-in: diferente dos hooks de aprendizado (que so gravam em docs/project/ e num cursor local), este
// EXECUTA comandos do projeto. Vem desligado; o /setup pergunta e, com o aceite, grava o bloco de
// .claude/hooks/quality/hooks.quality.json no .claude/settings.local.json de quem aceitou.
//
// Agnostico de stack: o kit nao adivinha comando. Os comandos vem de .claude/quality.json do projeto
// (gerado pelo /setup a partir da stack, editavel):
//   { "onEdit": [ { "match": "\\.(ts|tsx)$", "commands": ["npx --no-install prettier --write {file}",
//                   "npx --no-install vitest run {testFile}"], "timeout": 120 } ] }
// Placeholders: {file} = arquivo editado; {testFile} = teste colocado (x.test.ts / x.spec.ts ao lado).
// Comando com {testFile} sem teste colocado e pulado.
//
// Saida: comando com exit != 0 -> {"decision":"block","reason":...} — o Claude recebe a saida e
// corrige. Nada falhou -> sem saida. Qualquer erro do proprio hook -> exit 0 sem saida (o hook nunca
// trava o trabalho por defeito dele).

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname, relative, isAbsolute, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

const quote = (s) => (/[\s"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);

function colocatedTest(file) {
  const dir = dirname(file);
  const ext = extname(file);
  const base = basename(file, ext);
  if (/\.(test|spec)$/.test(base)) return file; // editou o proprio teste
  for (const kind of ['test', 'spec']) {
    for (const e of [ext, '.ts', '.tsx', '.js', '.jsx']) {
      const candidate = join(dir, `${base}.${kind}${e}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

async function main() {
  let input = {};
  try { input = JSON.parse(await readStdin()); } catch { return; }
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const raw = input.tool_input?.file_path;
  if (!raw) return;
  const abs = isAbsolute(raw) ? raw : resolve(root, raw);
  const rel = relative(root, abs).split('\\').join('/');
  if (rel.startsWith('..') || !existsSync(abs)) return; // fora do projeto ou removido

  const configPath = join(root, '.claude', 'quality.json');
  if (!existsSync(configPath)) return;
  let config;
  try { config = JSON.parse(readFileSync(configPath, 'utf8')); } catch { return; }

  // Orcamento total abaixo do timeout do hook (300 s em hooks.quality.json): se o harness matar o
  // hook, ele sai sem saida e a falha passa calada. Comando que nao cabe no que sobrou nao roda e
  // vira falha declarada.
  const BUDGET_MS = 280 * 1000;
  const started = Date.now();
  const failures = [];
  for (const rule of config.onEdit || []) {
    let re;
    try { re = new RegExp(rule.match); } catch { continue; }
    if (!re.test(rel)) continue;
    const testFile = colocatedTest(abs);
    for (const template of rule.commands || []) {
      if (template.includes('{testFile}') && !testFile) continue;
      const cmd = template
        .replaceAll('{file}', quote(rel))
        .replaceAll('{testFile}', testFile ? quote(relative(root, testFile).split('\\').join('/')) : '');
      const left = BUDGET_MS - (Date.now() - started);
      if (left < 5000) {
        failures.push(`$ ${cmd}\n(nao rodou: orcamento de ${BUDGET_MS / 1000} s do hook esgotado — reduza os timeouts do .claude/quality.json)`);
        continue;
      }
      const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', timeout: Math.min((rule.timeout || 120) * 1000, left), maxBuffer: 16 * 1024 * 1024 });
      if (r.error || r.status !== 0) {
        const out = `${r.stdout || ''}\n${r.stderr || ''}`.trim().split('\n').slice(-40).join('\n');
        failures.push(`$ ${cmd}\n(exit ${r.error ? r.error.code || 'erro' : r.status})\n${out}`);
      }
    }
  }

  if (failures.length) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: `[praxis · qualidade na edicao] ${rel}: ${failures.length} comando(s) do .claude/quality.json falharam. Corrija antes de seguir.\n\n${failures.join('\n\n')}`,
    }));
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
