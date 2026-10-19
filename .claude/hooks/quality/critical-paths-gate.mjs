#!/usr/bin/env node
// critical-paths-gate.mjs — hook OPT-IN (PreToolUse Write|Edit|MultiEdit|NotebookEdit): edicao em caminho
// critico pede confirmacao humana.
//
// Por que existe: o loop executa fatias sem humano lendo cada passo. Alguns arquivos nao sao codigo:
// sao decisao registrada (ADR) ou infraestrutura compartilhada (pipeline, configuracao do kit). Um
// agent que edita um ADR para casar com o codigo que acabou de escrever e a versao arquitetural do
// "ajuste-para-passar": o registro deixa de ser a decisao e vira a justificativa retroativa.
//
// Usa "ask" e nao "deny" de proposito:
//   - sessao interativa  -> uma confirmacao e o trabalho deliberado segue normalmente;
//   - execucao sem humano (loop-driver, claude -p) -> ninguem confirma, a alteracao nao acontece.
// Bloqueia a alteracao NAO supervisionada sem transformar trabalho legitimo em briga com o harness.
//
// Caminhos: "criticalPaths" (regex sobre o caminho relativo, com /) em .claude/quality.json; sem a
// chave, vale o DEFAULT abaixo. Qualquer erro do proprio hook -> exit 0 sem saida.

import { readFileSync, existsSync } from 'node:fs';
import { join, relative, isAbsolute, resolve } from 'node:path';

const DEFAULT = [
  '^docs/adr/',
  '^\\.github/workflows/',
  '^\\.claude/settings\\.json$',
  '^\\.claude/hooks/',
  '^\\.claude/quality\\.json$',
];

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  let input = {};
  try { input = JSON.parse(await readStdin()); } catch { return; }
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const raw = input.tool_input?.file_path || input.tool_input?.notebook_path;
  if (!raw) return;
  const abs = isAbsolute(raw) ? raw : resolve(root, raw);
  const rel = relative(root, abs).split('\\').join('/');
  if (rel.startsWith('..')) return;

  let patterns = DEFAULT;
  const configPath = join(root, '.claude', 'quality.json');
  if (existsSync(configPath)) {
    try {
      const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
      if (Array.isArray(cfg.criticalPaths)) patterns = cfg.criticalPaths;
    } catch { /* config ilegivel: fica o default */ }
  }

  const hit = patterns.find((p) => { try { return new RegExp(p).test(rel); } catch { return false; } });
  if (!hit) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: `[praxis · caminho critico] ${rel} e decisao registrada ou infraestrutura compartilhada (padrao ${hit}). Confirme que a mudanca e deliberada — nao um ajuste do registro para casar com o codigo.`,
    },
  }));
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
