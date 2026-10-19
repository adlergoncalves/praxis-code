#!/usr/bin/env node
// mutants.mjs — Mutantes por script: aplica cada mutante, roda o teste que deveria mata-lo, reverte o
// arquivo e imprime o placar.
//
// Por que existe: um teste que NASCE VERDE nao provou nada — ele passaria com ou sem a regra. O RED do
// test-first e a prova de que o teste protege o comportamento; quando nao ha RED possivel (teste de
// caracterizacao, regra ja existente), a prova e o mutante: quebrar a regra de proposito e ver o teste
// falhar. Feito a mao, cada mutante custa 3-4 passos (editar, compilar, testar, reverter); aqui e uma
// chamada para todos.
//
// Uso: node .claude/scripts/mutants.mjs <mutantes.json> [--root <dir>]
//
// O JSON e uma lista; cada item:
//   { "id": "M1",
//     "arquivo": "src/pedido/desconto.ts",          (relativo a raiz do projeto)
//     "de": "if (total >= 100)",                     (aparece UMA vez no arquivo)
//     "para": "if (total > 100)",
//     "comando": "npx vitest run src/pedido/desconto.test.ts",
//     "timeout": 900,                                (opcional, segundos)
//     "sinaisDeCompilacao": ["error TS"] }           (opcional — substitui o padrao)
//
// Resultado de cada mutante:
//   MORTO        o comando falhou: o teste pegou a mutacao (o esperado)
//   VIVO         o comando passou: o teste nao protege a regra
//   NAO COMPILA  a saida tem sinal de erro de compilacao: nao prova nada, reescreva o mutante
//   INVALIDO     o texto "de" nao aparece exatamente uma vez
// O arquivo volta byte a byte ao original em qualquer caso, inclusive com erro ou Ctrl+C. Final de linha
// CRLF e respeitado. Sai com codigo 1 se algum mutante nao estiver MORTO.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const SINAIS_PADRAO = [
  'error CS', 'Build FAILED', 'error TS', 'SyntaxError', 'error[E', 'cannot find symbol',
  'COMPILATION ERROR', 'Compilation failed', 'IndentationError', 'Falha da compilação',
];

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root');
const rootIdx = args.indexOf('--root');
const ROOT = resolve(rootIdx !== -1 ? args[rootIdx + 1] : process.cwd());
if (!file || !existsSync(file)) {
  console.error('uso: node .claude/scripts/mutants.mjs <mutantes.json> [--root <dir>]');
  process.exit(2);
}

// restauracao garantida: o original do arquivo em mutacao fica aqui ate ser reposto
let pendente = null;
const restaurar = () => { if (pendente) { writeFileSync(pendente.path, pendente.bytes); pendente = null; } };
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { restaurar(); process.exit(130); });
process.on('exit', restaurar);

function aplicarETestar(m) {
  const alvo = join(ROOT, m.arquivo);
  if (!existsSync(alvo)) return { estado: 'INVALIDO (arquivo nao existe)', segundos: 0, cauda: '' };
  const original = readFileSync(alvo);
  const texto = original.toString('utf8');
  const crlf = texto.includes('\r\n');
  const norm = (s) => (crlf ? s.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n') : s);
  const de = norm(m.de);
  const para = norm(m.para);
  const ocorrencias = texto.split(de).length - 1;
  if (ocorrencias !== 1) return { estado: `INVALIDO (${ocorrencias} ocorrencias)`, segundos: 0, cauda: '' };

  const inicio = Date.now();
  let r;
  try {
    pendente = { path: alvo, bytes: original };
    writeFileSync(alvo, texto.replace(de, () => para), 'utf8'); // funcao: sem interpretar $&, $', $$
    r = spawnSync(m.comando, { cwd: ROOT, shell: true, encoding: 'utf8', timeout: (m.timeout || 900) * 1000, maxBuffer: 64 * 1024 * 1024 });
  } finally {
    restaurar();
  }
  const saida = `${r.stdout || ''}${r.stderr || ''}`;
  const segundos = (Date.now() - inicio) / 1000;
  const sinais = Array.isArray(m.sinaisDeCompilacao) ? m.sinaisDeCompilacao : SINAIS_PADRAO;
  let estado;
  if (r.error && r.error.code === 'ETIMEDOUT') estado = 'NAO COMPILA (timeout — sem conclusao)';
  else if (r.status === 0) estado = 'VIVO';
  else if (sinais.some((s) => saida.includes(s))) estado = 'NAO COMPILA';
  else estado = 'MORTO';
  // linha que explica o NAO COMPILA: a que contem o sinal (a ultima linha costuma ser ruido, ex.: versao do runtime)
  const linhaSinal = saida.split(/\r?\n/).find((l) => sinais.some((s) => l.includes(s)));
  return { estado, segundos, cauda: linhaSinal || saida.trim().split(/\r?\n/).pop() || '' };
}

const mutantes = JSON.parse(readFileSync(file, 'utf8'));
const placar = [];
for (const m of mutantes) {
  const { estado, segundos, cauda } = aplicarETestar(m);
  placar.push({ id: m.id, estado });
  console.log(`${String(m.id).padEnd(6)} ${estado.padEnd(26)} ${segundos.toFixed(0).padStart(5)} s  ${m.arquivo.split('/').pop()}`);
  if (estado.startsWith('NAO COMPILA') && cauda.trim()) console.log(`       ${cauda.trim().slice(0, 200)}`);
}
const mortos = placar.filter((p) => p.estado === 'MORTO').length;
console.log(`\n${mortos} de ${placar.length} mortos`);
process.exitCode = mortos === placar.length ? 0 : 1;
