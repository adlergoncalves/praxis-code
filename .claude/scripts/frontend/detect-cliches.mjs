#!/usr/bin/env node
// detect-cliches.mjs — Detector de cliches de IA do kit Praxis (Fase 3, Passo 3).
//
// Detector NATIVO, AGNOSTICO de stack, sem LLM. Le source-level (CSS/HTML/JS/JSX/TSX/Vue/Svelte/Astro)
// e detecta cliches comuns de UI gerada por IA. Conhecimento de base: .claude/reference/frontend/anti-patterns.md.
//
// Uso (direto):
//   node .claude/scripts/frontend/detect-cliches.mjs <path>
//   node .claude/scripts/frontend/detect-cliches.mjs <path> --json
//
// Exit codes:
//   0 — nenhum erro
//   1 — erros encontrados (warnings nao bloqueiam)
//   2 — falha de execucao (path invalido, etc.)
//
// Saida:
//   - Default: linhas legiveis "severity  rule  file:line — message"
//   - --json: objeto { findings: [...], summary: { errors, warnings, files_scanned } }
//
// IMPORTANTE — agnostico:
//   - Este detector NAO conhece stack. Olha o output textual (source files).
//   - A regra "hardcoded vs token" (que depende da stack) e adicionada no Passo 4 via stack-profile.
//   - Comecar conservador. Calibrar via learnings (false-positives viram entradas em frontend-learnings.md).

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Configuracao
// ---------------------------------------------------------------------------

const SCANNABLE_EXTENSIONS = new Set([
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm',
  '.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs',
  '.vue', '.svelte', '.astro',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
  'coverage', 'out', '.cache', '.parcel-cache', '.turbo', '.vercel', '.netlify',
  '.claude', // nao escanear o proprio kit
]);

// ---------------------------------------------------------------------------
// Catalogo de regras (agnostico) — referencia: anti-patterns.md
// ---------------------------------------------------------------------------

// Cada regra retorna findings: [{ line, column, match, ... }]
// Severity: 'error' (bloqueia CI), 'warn' (sinaliza), 'info' (heuristico).

const RULES = [
  // ---------------- COR (CROMATICOS) ----------------
  {
    id: 'color/black-pure',
    severity: 'warn',
    description: 'Preto puro #000 — UI digital parece amador',
    suggestion: 'Use cinza muito escuro com tom da cor primaria (ex.: #0a0e1a em produto azul). Ver heuristics.md #1 e anti-patterns.md #2.2.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    pattern: /#000(?:000)?(?![\w-])|rgba?\(\s*0\s*,\s*0\s*,\s*0(?:\s*,\s*[\d.]+)?\s*\)/g,
  },

  {
    id: 'color/purple-blue-gradient',
    severity: 'error',
    description: 'Gradiente roxo->azul / azul->ciano — o cliche SaaS-IA mais reconhecivel',
    suggestion: 'Use cor solida com identidade ou gradient com paleta autoral justificada pelo Charter. Ver anti-patterns.md #2.1.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    // Detecta gradient (linear/radial/conic) contendo hex no espectro roxo (7c3aed/8b5cf6/a855f7/9333ea/6366f1)
    // junto com hex no espectro azul/ciano (3b82f6/2563eb/1d4ed8/0ea5e9/06b6d4) — em qualquer ordem.
    pattern: new RegExp(
      [
        // gradient com pelo menos uma cor roxa e uma azul/ciano (em qualquer ordem)
        '(?:linear|radial|conic)-gradient\\([^)]*',
        '(?:#(?:7c3aed|8b5cf6|a855f7|9333ea|6366f1|7e22ce|6b21a8)',
        '[^)]*#(?:3b82f6|2563eb|1d4ed8|0ea5e9|06b6d4|0891b2|3aa0ff)',
        '|#(?:3b82f6|2563eb|1d4ed8|0ea5e9|06b6d4|0891b2|3aa0ff)',
        '[^)]*#(?:7c3aed|8b5cf6|a855f7|9333ea|6366f1|7e22ce|6b21a8)',
        ')[^)]*\\)',
      ].join(''),
      'gi'
    ),
  },

  {
    id: 'color/gradient-text',
    severity: 'warn',
    description: 'Gradient text via background-clip — decorativo, sacrifica legibilidade',
    suggestion: 'Use cor solida; se precisa enfase, recorra a peso/tamanho/espaco. Ver anti-patterns.md #2.4.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    pattern: /(?:-webkit-)?background-clip\s*:\s*text\b/gi,
  },

  {
    id: 'color/glassmorphism',
    severity: 'warn',
    description: 'Glassmorphism decorativo (backdrop-filter: blur) — cliche de "moderno"',
    suggestion: 'Reserve blur para overlays funcionais (modal backdrop). Em superficies de conteudo, use sombras escaladas por elevacao. Ver anti-patterns.md #2.5.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    pattern: /backdrop-filter\s*:\s*[^;]*blur\s*\(/gi,
  },

  // ---------------- COMPOSICAO ----------------
  {
    id: 'composition/side-stripe',
    severity: 'warn',
    description: 'Side-stripe colorido como acento (border-left fino com cor saturada) — cliche Bootstrap-era',
    suggestion: 'Use icone + cor de fundo sutil; ou tipografia que carrega a enfase. Ver anti-patterns.md #3.4.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    // border-left com width 2-6px + solid + uma cor (hex curto/longo, rgb, hsl). Conservador: nao tenta validar saturacao.
    pattern: /border-left\s*:\s*[2-6]px\s+(?:solid|dashed|dotted)\s+(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g,
  },

  // ---------------- MOTION ----------------
  {
    id: 'motion/bounce-overshoot',
    severity: 'warn',
    description: 'Easing com overshoot (bounce/back) em transition — frequente em microinteracoes onde nao cabe',
    suggestion: 'Em product register, use ease-out 150-250ms. Reserve bounce para celebracoes ou register brand justificado. Ver motion-design.md + anti-patterns.md #5.1.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    // cubic-bezier com y1 (pos 2) ou y2 (pos 4) >= 1.1 OU <= -0.1 (overshoot)
    pattern: /cubic-bezier\(\s*-?\d*\.?\d+\s*,\s*(?:-\d*\.?\d+|[1-9]\d*\.?\d*|1\.[1-9]\d*)\s*,\s*-?\d*\.?\d+\s*,\s*(?:-\d*\.?\d+|[1-9]\d*\.?\d*|1\.[1-9]\d*|[\d.]+)\s*\)/g,
  },

  {
    id: 'motion/excessive-duration',
    severity: 'warn',
    description: 'Duracao de transition > 600ms em microinteracao — trava percepcao de responsividade',
    suggestion: 'Use buckets do motion-design.md: instant 100ms, fast 150-200ms, normal 250-300ms, slow 400-500ms. >600ms so em hero/celebracao intencional.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    // Detecta transition-duration > 600ms (em ms) ou > 0.6s
    pattern: /transition(?:-duration)?\s*:\s*[^;]*?(?:(?:[6-9]\d{2}|\d{4,})ms|(?:0?\.[7-9]\d*|[1-9]\d*\.?\d*)s)/gi,
  },

  // ---------------- TIPOGRAFIA ----------------
  {
    id: 'typography/overused-font',
    severity: 'info',
    description: 'Fonte super-usada por IA (Inter/Geist/Söhne) — cliche se for a unica fonte do projeto',
    suggestion: 'Em brand register, parear com display font ou escolher fonte com personalidade. Em product register, considerar system stack. Ver anti-patterns.md #1.1.',
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    // font-family com Inter/Geist/Söhne/Soehne
    pattern: /font-family\s*:\s*[^;]*?(?:["']?(Inter|Geist|S(?:ö|oe)hne)["']?)/gi,
  },
];

// ---------------------------------------------------------------------------
// Stack profile (Passo 4 — adapter por stack)
// ---------------------------------------------------------------------------
//
// O stack-profile.json materializa "o que e token nesta stack". Schema v1:
// {
//   "version": 1,
//   "framework": "react-vite" | "react-next" | "angular" | "vue" | ...,
//   "uiLibrary": "shadcn" | "angular-material" | "vuetify" | "mui" | "none",
//   "styling": "tailwind" | "css-modules" | "scss" | "theme-provider" | ...,
//   "tokens": {
//     "format": "css-variables" | "theme-provider",
//     "location": "src/globals.css",
//     "patterns": {
//       "valid":     ["regex1", "regex2", ...],   // padroes que CONTAM como uso de token
//       "hardcoded": ["regex1", "regex2", ...]    // padroes que indicam violacao
//     }
//   }
// }
//
// O detector NAO PRECISA do profile pra rodar — as 8 regras agnosticas funcionam sem ele.
// Quando o profile esta presente, o detector ADICIONA a regra `tokens/hardcoded-color`
// baseada no profile.tokens.patterns.hardcoded. Pular linhas com declaracao de token
// (`--xxx: ...`, `:root`) e comentarios.

async function loadStackProfile(targetRoot, overridePath) {
  // Tentar override → cwd/docs/design-system → targetRoot/docs/design-system
  const candidates = [];
  if (overridePath) candidates.push(overridePath);
  candidates.push(join(process.cwd(), 'docs', 'design-system', 'stack-profile.json'));
  if (targetRoot && targetRoot !== process.cwd()) {
    candidates.push(join(targetRoot, 'docs', 'design-system', 'stack-profile.json'));
  }

  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const text = await readFile(p, 'utf-8');
        const profile = JSON.parse(text);
        return { profile, source: p };
      } catch (err) {
        // JSON invalido — avisar via stderr, NAO travar
        console.error(`AVISO: stack-profile inválido em ${p}: ${err.message}. Detector segue sem ele.`);
        return null;
      }
    }
  }
  return null;
}

// Constroi regra sintetizada `tokens/hardcoded-color` a partir do profile.
// Conservadora: skip de linhas de definicao de variavel/comentario.
function buildSynthesizedRules(profile) {
  if (!profile?.tokens?.patterns?.hardcoded?.length) return [];

  const combined = profile.tokens.patterns.hardcoded.map((p) => `(?:${p})`).join('|');
  let rx;
  try {
    rx = new RegExp(combined, 'g');
  } catch (err) {
    console.error(`AVISO: regex invalido em stack-profile.tokens.patterns.hardcoded: ${err.message}. Pulando regra sintetizada.`);
    return [];
  }

  const stackLabel = `${profile.framework ?? 'stack'}/${profile.uiLibrary ?? 'lib'}`;
  const tokenLoc = profile.tokens.location ?? 'tokens';
  const tokenFormat = profile.tokens.format ?? 'tokens';

  return [{
    id: 'tokens/hardcoded-color',
    severity: 'warn',
    description: `Cor hardcoded fora de declaracao de token — projeto usa "${stackLabel}", deveria usar token`,
    suggestion: `Use o token definido em ${tokenLoc} (formato: ${tokenFormat}). Ver register-{brand|product}.md e color-and-contrast.md.`,
    extensions: ['.css', '.scss', '.sass', '.less', '.html', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro'],
    pattern: rx,
    // Conservador: pular declaracoes de variavel, blocos :root e linhas de comentario.
    skipLine: (lineText) => {
      const trimmed = lineText.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
      if (lineText.includes(':root')) return true;
      // declaracao de CSS variable na linha (ex: `--primary: #abc;`)
      if (/^\s*--[\w-]+\s*:/.test(lineText)) return true;
      return false;
    },
  }];
}

// ---------------------------------------------------------------------------
// Extrair linha de um offset
// ---------------------------------------------------------------------------

function getLineAt(text, offset) {
  let start = offset;
  while (start > 0 && text[start - 1] !== '\n') start--;
  let end = offset;
  while (end < text.length && text[end] !== '\n') end++;
  return text.slice(start, end);
}

// ---------------------------------------------------------------------------
// Walker (varre arquivos relevantes)
// ---------------------------------------------------------------------------

async function* walk(rootPath) {
  const st = await stat(rootPath);
  if (st.isFile()) {
    yield rootPath;
    return;
  }
  if (!st.isDirectory()) return;

  const entries = await readdir(rootPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      yield* walk(join(rootPath, entry.name));
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (SCANNABLE_EXTENSIONS.has(ext)) {
        yield join(rootPath, entry.name);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Linha/coluna a partir de offset
// ---------------------------------------------------------------------------

function offsetToLineCol(text, offset) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') { line++; col = 1; } else { col++; }
  }
  return { line, col };
}

// ---------------------------------------------------------------------------
// Aplicar regras a um arquivo
// ---------------------------------------------------------------------------

async function scanFile(filePath, rootPath, rules) {
  const ext = extname(filePath).toLowerCase();
  let content;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return [];
  }

  const findings = [];
  const rel = relative(rootPath, filePath) || filePath;

  for (const rule of rules) {
    if (!rule.extensions.includes(ext)) continue;

    // Clonar regex pra reset de lastIndex em global
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m;
    while ((m = re.exec(content)) !== null) {
      // Suporte a skipLine — regras profile-driven podem ignorar contextos (ex: `:root`, `--var:`)
      if (rule.skipLine) {
        const lineText = getLineAt(content, m.index);
        if (rule.skipLine(lineText)) {
          if (m.index === re.lastIndex) re.lastIndex++;
          continue;
        }
      }
      const { line, col } = offsetToLineCol(content, m.index);
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        file: rel,
        line,
        column: col,
        match: m[0].length > 80 ? m[0].slice(0, 77) + '...' : m[0],
        description: rule.description,
        suggestion: rule.suggestion,
      });
      // Proteger contra regex zero-width
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function detect(targetPath, options = {}) {
  if (!existsSync(targetPath)) {
    throw new Error(`Path nao encontrado: ${targetPath}`);
  }

  const st = await stat(targetPath);
  const rootPath = st.isDirectory() ? targetPath : '.';

  // Carregar stack-profile (opcional)
  const loaded = await loadStackProfile(rootPath, options.profilePath);
  const synthRules = loaded ? buildSynthesizedRules(loaded.profile) : [];
  const activeRules = [...RULES, ...synthRules];

  const allFindings = [];
  let filesScanned = 0;

  for await (const filePath of walk(targetPath)) {
    filesScanned++;
    const findings = await scanFile(filePath, rootPath, activeRules);
    allFindings.push(...findings);
  }

  const summary = {
    files_scanned: filesScanned,
    errors: allFindings.filter((f) => f.severity === 'error').length,
    warnings: allFindings.filter((f) => f.severity === 'warn').length,
    infos: allFindings.filter((f) => f.severity === 'info').length,
    total: allFindings.length,
    stack_profile: loaded ? {
      source: loaded.source,
      framework: loaded.profile.framework,
      ui_library: loaded.profile.uiLibrary,
    } : null,
  };

  return { findings: allFindings, summary };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function formatText(report) {
  const lines = [];
  const { findings, summary } = report;

  if (findings.length === 0) {
    lines.push('OK  Nenhum cliche detectado.');
    lines.push(`    Arquivos varridos: ${summary.files_scanned}`);
    return lines.join('\n');
  }

  // Agrupar por arquivo
  const byFile = {};
  for (const f of findings) {
    byFile[f.file] = byFile[f.file] || [];
    byFile[f.file].push(f);
  }

  for (const [file, fs] of Object.entries(byFile)) {
    lines.push(`\n${file}`);
    for (const f of fs) {
      const sev = f.severity.toUpperCase().padEnd(5);
      lines.push(`  ${sev} ${f.rule}  L${f.line}:${f.column}`);
      lines.push(`        ${f.description}`);
      lines.push(`        match: ${f.match}`);
      lines.push(`        sugestao: ${f.suggestion}`);
    }
  }

  lines.push('');
  lines.push(`Resumo: ${summary.errors} erro(s), ${summary.warnings} aviso(s), ${summary.infos} info(s) em ${summary.files_scanned} arquivo(s).`);

  return lines.join('\n');
}

function flagValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  return v && !v.startsWith('-') ? v : null;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node detect-cliches.mjs <path> [--json] [--profile <path>]');
    process.exit(args.length === 0 ? 2 : 0);
  }

  const wantJson = args.includes('--json');
  const profilePath = flagValue(args, '--profile');
  const targetPath = args.find((a) => !a.startsWith('-') && a !== profilePath);

  if (!targetPath) {
    console.error('ERRO: path nao informado.');
    process.exit(2);
  }

  let report;
  try {
    report = await detect(targetPath, { profilePath });
  } catch (err) {
    console.error(`ERRO: ${err.message}`);
    process.exit(2);
  }

  if (wantJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatText(report));
  }

  process.exit(report.summary.errors > 0 ? 1 : 0);
}

// Executa main apenas se chamado direto (nao se importado)
const isDirectRun = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
                    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isDirectRun) {
  main();
}
