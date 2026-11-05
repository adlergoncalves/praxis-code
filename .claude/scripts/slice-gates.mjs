#!/usr/bin/env node
// slice-gates.mjs — Gates objetivos de uma fatia: os comandos da tabela Gates do tasks.md, so das
// camadas que a fatia tocou, decididos pelo exit code. Devolve so o que falhou.
//
// Por que existe: "o gate passou" nao pode depender de o modelo ler direito a propria saida. Build
// quebrado e teste vermelho sao fatos; este script os produz sem gastar token, e quem le (a sessao
// da fatia antes do commit, o loop-driver antes do verificador) recebe uma linha por gate e, em cada
// falha, o fim da saida do comando.
//
// Agnostico de stack: o kit nao conhece comando. A tabela Gates do tasks.md declara, por camada:
//   Caminhos  globs dos arquivos da camada (`src/server/**, prisma/**`); `*` = sempre;
//             `—` = o runner nao roda (ex.: e2e que depende do app de pe — a sessao roda e o
//             verificador cobra a prova). Sem a coluna (tasks.md antigo), toda linha roda.
//   Comandos  os comandos entre crases. `{arquivos}` vira a lista dos arquivos alterados da camada
//             (ex.: `npx eslint {arquivos}`). Skill (`/x`) nao e comando e fica de fora.
// Arquivos alterados = desde --since (commitados, staged, na arvore e nao rastreados).
//
// Uso: node .claude/scripts/slice-gates.mjs --feature <nome> --since <rev> [--timeout <min>] [--json]
// Exit: 0 nenhum gate falhou · 1 algum gate FALHOU · 2 so falha de infraestrutura (comando
//       inexistente, erro ao iniciar) — nao e defeito da fatia, mas tambem nao e verde ·
//       3 uso invalido ou feature/tasks.md nao encontrado

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { read, resolveFeature, featurePaths, gates, changedFiles, matchesAny, git } from './lib/loop-artifacts.mjs';

const TAIL = 40;
const strip = (s) => String(s || '').replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
const quote = (f) => (/[\s"'&|<>()^%!;,]/.test(f) ? `"${f.replace(/"/g, '\\"')}"` : f);

// Comando inexistente e falha de infraestrutura, nao defeito da fatia. Confere o PATH antes de rodar:
// o exit code e a mensagem de "nao encontrado" variam por shell e por idioma do sistema.
const BUILTINS = new Set(['cd', 'pushd', 'popd', 'echo', 'set', 'export', 'call', 'source', '.', 'env', 'exit', 'test', '[']);
const pathCache = new Map();
function exists(root, cmd) {
  const first = (cmd.trim().match(/^"([^"]+)"|^(\S+)/) || [])[1] || cmd.trim().split(/\s+/)[0];
  if (!first || BUILTINS.has(first.toLowerCase()) || /^[A-Z_][A-Z0-9_]*=/i.test(first)) return true;
  if (/[\\/]/.test(first)) return true; // caminho explicito: o shell diz se existe
  if (!pathCache.has(first)) {
    const r = process.platform === 'win32'
      ? spawnSync('where', [first], { cwd: root, encoding: 'utf8' })
      : spawnSync('sh', ['-c', `command -v ${JSON.stringify(first)}`], { cwd: root, encoding: 'utf8' });
    pathCache.set(first, r.status === 0);
  }
  return pathCache.get(first);
}

function tail(text) {
  const lines = strip(text).split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
  return lines.slice(-TAIL);
}

/**
 * Roda os gates da fatia. Devolve { code, lines, results }.
 * results: [{ camada, comando, estado: OK|FALHOU|INFRA, saida? }]
 */
export function runGates(root, feature, since, { timeoutMin = 20 } = {}) {
  const tasks = read(featurePaths(root, feature).tasks);
  if (!git(root, ['rev-parse', '--verify', `${since}^{commit}`]).ok) throw new Error(`--since ${since} nao e um commit deste repositorio`);
  const files = changedFiles(root, since);
  const rows = gates(tasks);
  const lines = [];
  const results = [];
  if (!files.length) return { code: 0, lines: [`Nenhum arquivo alterado desde ${since.slice(0, 12)}: nada a verificar.`], results };
  if (!rows.some((r) => r.comandos.length)) {
    return { code: 0, lines: ['[AVISO] a tabela Gates do tasks.md nao tem comando entre crases: nenhum gate objetivo rodou.'], results };
  }

  for (const row of rows) {
    if (!row.comandos.length) continue;
    if (row.caminhos === null) { lines.push(`[NAO RODA] ${row.camada}: sem caminhos na tabela Gates (a sessao roda; o verificador cobra a prova)`); continue; }
    const mine = row.caminhos === '*' ? files : files.filter((f) => matchesAny(f, row.caminhos));
    if (!mine.length) continue;
    for (const cmd of row.comandos) {
      if (!exists(root, cmd)) {
        results.push({ camada: row.camada, comando: cmd, estado: 'INFRA', saida: [] });
        lines.push(`[INFRA] ${row.camada}: \`${cmd}\` (comando fora do PATH)`);
        continue;
      }
      const command = cmd.replace(/\{arquivos\}/g, mine.map(quote).join(' '));
      // cmd.exe escreve na codepage do console: forca UTF-8 para a saida chegar legivel
      const r = spawnSync(process.platform === 'win32' ? `chcp 65001>nul & ${command}` : command, {
        cwd: root, shell: true, encoding: 'utf8', timeout: timeoutMin * 60 * 1000, maxBuffer: 256 * 1024 * 1024,
        env: { ...process.env, CI: process.env.CI || '1', NO_COLOR: '1', FORCE_COLOR: '0' },
      });
      const saida = `${r.stdout || ''}\n${r.stderr || ''}`;
      let estado = 'OK';
      let nota = '';
      if (r.error && r.error.code === 'ETIMEDOUT') { estado = 'FALHOU'; nota = ` (passou de ${timeoutMin} min)`; }
      else if (r.error) { estado = 'INFRA'; nota = ` (${r.error.message})`; }
      else if (r.status === 127 || r.status === 9009) { estado = 'INFRA'; nota = ' (comando inexistente)'; }
      else if (r.status !== 0) { estado = 'FALHOU'; nota = ` (exit ${r.status})`; }
      results.push({ camada: row.camada, comando: cmd, estado, ...(estado !== 'OK' ? { saida: tail(saida) } : {}) });
      lines.push(`[${estado}] ${row.camada}: \`${cmd}\`${nota}`);
      if (estado !== 'OK') for (const l of tail(saida)) lines.push(`    ${l}`);
    }
  }
  if (!results.length) lines.push(`Nenhuma camada da tabela Gates casa com os ${files.length} arquivo(s) alterado(s): nenhum gate rodou.`);
  const code = results.some((r) => r.estado === 'FALHOU') ? 1 : results.some((r) => r.estado === 'INFRA') ? 2 : 0;
  return { code, lines, results };
}

function main() {
  const args = process.argv.slice(2);
  const val = (name) => { const i = args.indexOf(name); const v = args[i + 1]; return i !== -1 && v && !v.startsWith('--') ? v : null; };
  const featureArg = val('--feature');
  const since = val('--since');
  const timeoutMin = Number(val('--timeout') ?? 20);
  if (!featureArg || !since || !(timeoutMin > 0)) {
    console.error('uso: node .claude/scripts/slice-gates.mjs --feature <nome> --since <rev> [--timeout <min>] [--json]');
    process.exit(3);
  }
  const root = process.cwd();
  let res;
  try {
    res = runGates(root, resolveFeature(root, featureArg), since, { timeoutMin });
  } catch (e) {
    console.error(`slice-gates: ${e.message}`);
    process.exit(3);
  }
  if (args.includes('--json')) process.stdout.write(JSON.stringify({ code: res.code, results: res.results }, null, 2) + '\n');
  else console.log(res.lines.join('\n'));
  process.exit(res.code);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
