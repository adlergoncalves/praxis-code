#!/usr/bin/env node
// loop-briefing.mjs — Recorte do pacote para UMA fatia (ou um grupo) do loop: o que a sessao le.
//
// Por que existe: cada sessao do loop lia o pacote inteiro (spec + plan + tasks, que crescem com o
// Loop Log), e esse texto fica no contexto, relido em toda chamada da sessao. O recorte leva so o
// que a fatia usa:
//
//   tasks.md  a fatia (contrato, sub-tasks, BDD), o DoD, os Gates, o Preflight, o Loop Log e, do
//             Log de iteracoes, as linhas da fatia (o watchdog conta nelas) e as mais recentes
//   spec.md   Escopo, Regras de Negocio, Decisoes Fechadas/Diferidas, Armadilhas, Implementation Notes
//   plan.md   Modulo de Referencia, Fatos Confirmados, Infra de Verificacao
//
// Fica fora o que a fatia cita e abre quando precisa: ADRs, Anatomia da Tela, Data Model, Contracts.
// Secao que o pacote nao tem vira uma linha "(nao encontrada)", para a sessao saber que pode abrir
// o arquivo. Usado pelo loop-driver (sessao da fatia e verificador) e pelo /execute --interativo.
//
// Uso: node .claude/scripts/loop-briefing.mjs --feature <pasta-em-docs/specs> --fatias U3[,U4] [--log N]
// Exit: 0 ok · 1 fatia ou feature nao encontrada · 2 uso invalido

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { read, resolveFeature, featurePaths, section, sectionText, slices, groups, loopLog } from './lib/loop-artifacts.mjs';

function block(title, body, origin) {
  const content = body && body.trim() ? body.trim() : `(nao encontrada em ${origin}; abra o arquivo se a fatia precisar)`;
  return `<!-- ${origin} -->\n### ${title}\n\n${content}`;
}

function tableRows(lines) {
  return lines.filter((l) => l.trim().startsWith('|') && !/^\|\s*:?-{2,}/.test(l.trim()));
}

/** Log de iteracoes: linhas das fatias-alvo + as `n` mais recentes (sem repetir). */
function iterationLog(tasks, ids, n) {
  const s = section(tasks, /Log de itera/i);
  if (!s) return null;
  const rows = tableRows(s.lines);
  if (rows.length < 2) return null;
  const [head, ...body] = rows;
  const data = body.filter((r) => !/^\|\s*—\s*\|/.test(r));
  const own = data.filter((r) => ids.some((id) => new RegExp(`\\|\\s*${id.replace(/\./g, '\\.')}\\s*\\|`).test(r)));
  const recent = data.slice(-n).filter((r) => !own.includes(r));
  const sep = '|' + head.split('|').slice(1, -1).map(() => '---').join('|') + '|';
  const out = [`Linhas de ${ids.join(', ')}: ${own.length ? '' : '(nenhuma: primeira tentativa)'}`];
  if (own.length) out.push(head, sep, ...own);
  if (recent.length) out.push('', 'Mais recentes:', head, sep, ...recent);
  return out.join('\n');
}

export function buildBriefing(root, feature, ids, { logLines = 5 } = {}) {
  const p = featurePaths(root, feature);
  const tasks = read(p.tasks);
  const spec = existsSync(p.spec) ? read(p.spec) : '';
  const plan = existsSync(p.plan) ? read(p.plan) : '';
  const all = slices(tasks);
  const missing = ids.filter((id) => !all.some((s) => s.id === id));
  if (missing.length) throw new Error(`fatia(s) sem secao "### ${missing[0]} — ..." no tasks.md: ${missing.join(', ')}`);

  const blocks = [];
  for (const id of ids) blocks.push(block(`Fatia ${id} (tasks.md)`, all.find((s) => s.id === id).text, 'tasks.md'));
  if (ids.length > 1) {
    const g = [...groups(tasks)].find(([, us]) => ids.every((id) => us.includes(id)));
    const row = g ? tasks.split(/\r?\n/).find((l) => new RegExp(`^\\|\\s*${g[0]}\\s*\\|`).test(l)) : null;
    blocks.push(block('Grupo (tasks.md › Grupos paralelizáveis)', row ? `| Grupo | Fatias | Pontos de colisão | Ordem de integração |\n|---|---|---|---|\n${row}` : null, 'tasks.md'));
  }
  blocks.push(block('Definição de Pronto (tasks.md)', sectionText(tasks, /Defini[cç][aã]o de Pronto/i, { level: 2 }), 'tasks.md'));
  blocks.push(block('Gates (tasks.md)', sectionText(tasks, /^Gates\b/i, { level: 2 }), 'tasks.md'));
  const pre = section(tasks, /^Preflight/i, { level: 2 });
  blocks.push(block('Preflight (tasks.md)', pre ? tableRows(pre.lines).join('\n') : null, 'tasks.md'));
  const log = loopLog(tasks);
  blocks.push(block('Loop Log (tasks.md)', log.length ? ['| Fatia | Status | Data | Commit/PR | Notas |', '|---|---|---|---|---|', ...log.map((r) => r.raw)].join('\n') : null, 'tasks.md'));
  blocks.push(block('Log de iterações (tasks.md)', iterationLog(tasks, ids, logLines), 'tasks.md'));

  blocks.push(block('Escopo (spec.md)', sectionText(spec, /^Escopo\b/i, { level: 2 }), 'spec.md'));
  blocks.push(block('Regras de Negócio (spec.md)', sectionText(spec, /Regras de Neg[oó]cio/i, { level: 2 }), 'spec.md'));
  blocks.push(block('Decisões Fechadas e Diferidas (spec.md)', sectionText(spec, /Decis[oõ]es Fechadas/i, { level: 2 }), 'spec.md'));
  blocks.push(block('Armadilhas da Demanda (spec.md)', sectionText(spec, /Armadilhas/i, { level: 2 }), 'spec.md'));
  const notes = sectionText(spec, /Implementation Notes/i, { level: 2 });
  if (notes && notes.split(/\r?\n/).some((l) => /^###\s/.test(l))) blocks.push(block('Implementation Notes (spec.md)', notes, 'spec.md'));

  blocks.push(block('Módulo de Referência (plan.md)', sectionText(plan, /M[oó]dulo de Refer[eê]ncia/i, { level: 2 }), 'plan.md'));
  blocks.push(block('Fatos Confirmados (plan.md)', sectionText(plan, /Fatos Confirmados/i, { level: 2 }), 'plan.md'));
  const infra = sectionText(plan, /Infra de Verifica/i, { level: 2 });
  if (infra) blocks.push(block('Infra de Verificação (plan.md)', infra, 'plan.md'));

  const head = [
    `## RECORTE DO PACOTE — ${feature} · ${ids.join(', ')} (gerado por .claude/scripts/loop-briefing.mjs)`,
    '',
    `Este recorte substitui a leitura inteira de docs/specs/${feature}/{spec,plan,tasks}.md. Abra um desses`,
    'arquivos so se faltar algo que a fatia precisa, e diga no relatorio o que faltou. Os ADRs citados na',
    'fatia, a Anatomia da Tela, o Data Model e os Contracts nao estao aqui: abra a secao que a fatia cita.',
  ].join('\n');
  return `${head}\n\n${blocks.join('\n\n')}\n`;
}

function main() {
  const args = process.argv.slice(2);
  const val = (name) => { const i = args.indexOf(name); const v = args[i + 1]; return i !== -1 && v && !v.startsWith('--') ? v : null; };
  const featureArg = val('--feature');
  const fatias = (val('--fatias') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const n = Number(val('--log') ?? 5);
  if (!featureArg || !fatias.length || !Number.isInteger(n) || n < 0) {
    console.error('uso: node .claude/scripts/loop-briefing.mjs --feature <nome> --fatias U3[,U4] [--log N]');
    process.exit(2);
  }
  const root = process.cwd();
  try {
    process.stdout.write(buildBriefing(root, resolveFeature(root, featureArg), fatias, { logLines: n }));
  } catch (e) {
    console.error(`loop-briefing: ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
