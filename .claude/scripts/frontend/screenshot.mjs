#!/usr/bin/env node
// screenshot.mjs — Captura screenshot do app rodando para a critica visual do front.
//
// Usado pela critica de qualidade — /design critique, @check-visual-consistency e a revisao visual
// do /execute —, que leem o PNG resultante para criticar contra o brief e a ancora de design.
// Print serve a critica, nao a fidelidade (fidelidade e por valores).
//
// Uso (direto):
//   node .claude/scripts/frontend/screenshot.mjs <url> [--viewport WxH] [--out PATH] [--full-page] [--wait SELECTOR]
//
// Exit codes:
//   0 — screenshot capturado com sucesso
//   1 — Playwright nao instalado (degradacao graciosa — instrucoes printadas)
//   2 — falha de execucao (url invalida, dev server offline, etc.)
//
// REGRA AGNOSTICA: este script nao conhece a stack do projeto. Ele captura o RESULTADO renderizado
// (HTML/CSS computado, pixel), que e naturalmente agnostico. Aplica-se a qualquer stack.

import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const DEFAULT_OUT_DIR = 'docs/design-system/screenshots';

// ---------------------------------------------------------------------------
// Playwright dinamico — degradacao graciosa
// ---------------------------------------------------------------------------

async function loadPlaywright() {
  try {
    const playwright = await import('playwright');
    return playwright;
  } catch (err) {
    return null;
  }
}

function printPlaywrightInstructions() {
  console.error('Playwright nao instalado.');
  console.error('');
  console.error('Para habilitar screenshots automaticos:');
  console.error('  1. npm install -D playwright');
  console.error('  2. npx playwright install chromium');
  console.error('');
  console.error('Alternativa manual (sem Playwright):');
  console.error('  - Tire screenshot pelo browser/OS.');
  console.error('  - Salve em docs/design-system/screenshots/<feature>.png.');
  console.error('  - Aponte os agents (@check-visual-consistency, @design critique) ao path.');
}

// ---------------------------------------------------------------------------
// Parse de viewport "WxH"
// ---------------------------------------------------------------------------

function parseViewport(str) {
  if (!str) return DEFAULT_VIEWPORT;
  const m = str.match(/^(\d+)x(\d+)$/);
  if (!m) {
    throw new Error(`Viewport invalido: "${str}". Esperado formato WxH (ex.: 1280x800).`);
  }
  return { width: parseInt(m[1], 10), height: parseInt(m[2], 10) };
}

// ---------------------------------------------------------------------------
// Screenshot core
// ---------------------------------------------------------------------------

export async function screenshot(url, options = {}) {
  const playwright = await loadPlaywright();
  if (!playwright) {
    const err = new Error('playwright-missing');
    err.code = 'PLAYWRIGHT_MISSING';
    throw err;
  }

  const viewport = parseViewport(options.viewport);
  const fullPage = Boolean(options.fullPage);
  const waitSelector = options.wait || null;

  // Output path: explicit OR default dir + auto name
  const outPath = options.out
    ? resolve(options.out)
    : resolve(DEFAULT_OUT_DIR, autoName(url, viewport, fullPage));

  // Garantir diretorio
  const outDir = dirname(outPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 10000 });
    }
    await page.screenshot({ path: outPath, fullPage });
  } finally {
    await browser.close();
  }

  return {
    path: outPath,
    url,
    viewport,
    fullPage,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Auto-naming
// ---------------------------------------------------------------------------

function autoName(url, viewport, fullPage) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeUrl = url.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const tag = fullPage ? 'full' : 'viewport';
  return `${safeUrl}__${viewport.width}x${viewport.height}__${tag}__${ts}.png`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node screenshot.mjs <url> [--viewport WxH] [--out PATH] [--full-page] [--wait SELECTOR]');
    console.log('');
    console.log('Defaults:');
    console.log(`  viewport: ${DEFAULT_VIEWPORT.width}x${DEFAULT_VIEWPORT.height}`);
    console.log(`  out: ${DEFAULT_OUT_DIR}/<auto-name>.png`);
    process.exit(args.length === 0 ? 2 : 0);
  }

  const out = flagVal(args, '--out');
  const viewport = flagVal(args, '--viewport');
  const wait = flagVal(args, '--wait');
  const fullPage = args.includes('--full-page');
  const url = args.find((a) => !a.startsWith('-') && a !== out && a !== viewport && a !== wait);

  if (!url) {
    console.error('ERRO: url nao informada.');
    process.exit(2);
  }

  return { url, out, viewport, wait, fullPage };
}

function flagVal(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  return v && !v.startsWith('-') ? v : null;
}

async function main() {
  const opts = parseArgs(process.argv);

  try {
    const result = await screenshot(opts.url, opts);
    console.log(`OK  Screenshot salvo:`);
    console.log(`    path: ${result.path}`);
    console.log(`    url: ${result.url}`);
    console.log(`    viewport: ${result.viewport.width}x${result.viewport.height}${result.fullPage ? ' (full page)' : ''}`);
    console.log(`    timestamp: ${result.timestamp}`);
    process.exit(0);
  } catch (err) {
    if (err.code === 'PLAYWRIGHT_MISSING') {
      printPlaywrightInstructions();
      process.exit(1);
    }
    console.error(`ERRO ao capturar screenshot: ${err.message}`);
    process.exit(2);
  }
}

// Executa main apenas se chamado direto
const entry = process.argv[1]; // undefined quando importado via `node -e` ou como modulo
const isDirectRun = !!entry && (
  import.meta.url === `file://${entry.replace(/\\/g, '/')}` ||
  import.meta.url.endsWith(entry.split(/[\\/]/).pop())
);
if (isDirectRun) {
  main();
}
