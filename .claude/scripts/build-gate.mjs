#!/usr/bin/env node
// build-gate.mjs — Gate de build/typecheck do kit Praxis (TEMA 2: "pronto" sem verificacao).
//
// Motivacao: build quebrado foi descoberto so no deploy (Vercel) 2x. Este gate roda ANTES de
// declarar uma task concluida e ANTES de commit. E o passo objetivo que substitui "acho que ta ok".
//
// O que faz:
//   1. Le package.json do projeto e DESCOBRE o comando de verificacao (nao assume nenhum):
//      preferencia: "typecheck" > "type-check" > "tsc" > "build". Para projetos sem package.json
//      (ex.: backend .NET/Go/Python), tenta heuristicas conhecidas. Se nada for encontrado, sai 0
//      com aviso (nao bloqueia projeto sem build step).
//   2. Executa o comando. stdout/stderr sao repassados.
//   3. Exit 1 se o comando falhar (gate FECHADO), 0 se passar (gate ABERTO).
//
// Uso:
//   node .claude/scripts/build-gate.mjs [path-do-projeto] [--cmd "npm run build"] [--json]
//
// Exit codes:
//   0 — gate aberto (build/typecheck passou, ou nao ha o que verificar)
//   1 — gate fechado (build/typecheck falhou)
//   2 — falha de execucao do proprio gate (path invalido)
//
// NOTA: este gate NAO faz pos-migration (supabase db push / gen types). Isso e responsabilidade do
// executor (instrucao na skill /execute), porque depende de credenciais e estado do banco que o
// script nao deve assumir. O gate apenas garante que o codigo COMPILA depois da migration.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const TYPECHECK_PREFERENCE = ['typecheck', 'type-check', 'tsc', 'check', 'lint:types'];

function flagValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  return v && !v.startsWith('--') ? v : null;
}

// Descobre o melhor comando de verificacao para o projeto.
function discoverCommand(root) {
  const pkgPath = join(root, 'package.json');
  if (existsSync(pkgPath)) {
    let pkg = {};
    try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); } catch { /* ignore */ }
    const scripts = pkg.scripts || {};
    for (const name of TYPECHECK_PREFERENCE) {
      if (scripts[name]) return { cmd: `npm run ${name}`, kind: `script:${name}`, why: 'typecheck dedicado' };
    }
    // Sem typecheck dedicado: usa build se existir (verifica compilacao de fato).
    if (scripts.build) return { cmd: 'npm run build', kind: 'script:build', why: 'build (sem typecheck dedicado)' };
    // Projeto TS sem script: roda tsc direto se houver tsconfig.
    if (existsSync(join(root, 'tsconfig.json'))) {
      return { cmd: 'npx tsc --noEmit', kind: 'tsc-direct', why: 'tsconfig presente, sem script' };
    }
    return null; // JS puro sem build — nao bloqueia.
  }

  // Sem package.json: heuristicas por stack.
  if (existsSync(join(root, 'go.mod'))) return { cmd: 'go build ./...', kind: 'go', why: 'go.mod presente' };
  if (existsSync(join(root, 'Cargo.toml'))) return { cmd: 'cargo check', kind: 'rust', why: 'Cargo.toml presente' };
  const csproj = ['*.csproj', '*.sln'].some((g) => existsSync(join(root, g.replace('*', 'app'))));
  if (csproj) return { cmd: 'dotnet build', kind: 'dotnet', why: 'projeto .NET' };
  return null;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node build-gate.mjs [path] [--cmd "npm run build"] [--json]');
    process.exit(0);
  }
  const wantJson = args.includes('--json');
  const explicitCmd = flagValue(args, '--cmd');
  const root = args.find((a) => !a.startsWith('--') && a !== explicitCmd) || process.cwd();

  if (!existsSync(root)) {
    console.error(`ERRO: path nao encontrado: ${root}`);
    process.exit(2);
  }

  const discovered = explicitCmd ? { cmd: explicitCmd, kind: 'explicit', why: '--cmd' } : discoverCommand(root);

  if (!discovered) {
    const msg = 'AVISO: nenhum comando de build/typecheck detectado — gate ignorado (nao bloqueia).';
    if (wantJson) console.log(JSON.stringify({ gate: 'skipped', reason: 'no-build-step' }));
    else console.log(msg);
    process.exit(0);
  }

  if (!wantJson) console.log(`[build-gate] rodando: ${discovered.cmd}  (${discovered.why})\n`);

  const [bin, ...rest] = discovered.cmd.split(' ');
  const res = spawnSync(bin, rest, { cwd: root, stdio: wantJson ? 'pipe' : 'inherit', encoding: 'utf8', shell: true });
  const passed = res.status === 0;

  if (wantJson) {
    console.log(JSON.stringify({
      gate: passed ? 'open' : 'closed',
      command: discovered.cmd,
      kind: discovered.kind,
      exit_code: res.status,
      stdout: (res.stdout || '').slice(-4000),
      stderr: (res.stderr || '').slice(-4000),
    }, null, 2));
  } else {
    console.log(`\n[build-gate] ${passed ? 'ABERTO — verificacao passou.' : 'FECHADO — verificacao FALHOU. Nao declare pronto / nao comite.'}`);
  }
  process.exit(passed ? 0 : 1);
}

main();
