# Fontes de terceiros do front

Conhecimento de design de UI escrito por terceiros e trazido para o kit **sem alteração de
conteúdo** — só os arquivos foram renomeados (`SKILL.md` → nome próprio, para nenhuma
ferramenta confundi-los com skills do kit). Cada pasta fixa a origem num commit e mantém a
licença original ao lado. Para atualizar: clonar o repositório no commit desejado, substituir
os arquivos e registrar o commit novo nesta tabela.

| Pasta | Origem | Commit | Licença | Para que o kit usa |
|---|---|---|---|---|
| `interface-design/` | [Dammyjay93/interface-design](https://github.com/Dammyjay93/interface-design) — skill, comandos `design-review` e `design-deslop`, `system-template` e exemplos | `2f9be32` | MIT | **Núcleo do front de produto**: exploração do domínio, assinatura, checkpoint por componente, testes swap/squint/assinatura/token, régua de aprovação do review e o molde da memória de design (`docs/design-system/system.md`) |
| `frontend-design/` | [anthropics/skills](https://github.com/anthropics/skills) — `skills/frontend-design` | `dbd4588` | Apache-2.0 (`LICENSE.txt`) | Plano em duas passadas revisado contra o "default genérico", calibração dos clichês atuais de IA, escrita na interface |
| `web-interface-guidelines/` | [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) — `command.md` | `434b7f9` | MIT | Regras objetivas do `@check-web-guidelines` (acessibilidade, foco, formulários, navegação, estados) |
| `design-review-playwright/` | [OneRedOak/claude-code-workflows](https://github.com/OneRedOak/claude-code-workflows) — `design-review/` | `29a34c7` | MIT | Fases do review na tela real (interação, larguras, teclado, robustez, console) usadas na revisão visual do `/execute` |
| `redesign-audit/` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) — `skills/redesign-skill` | `f624f37` | MIT | **Só a seção "Design Audit"**, no `/design` sobre app existente e no legado |

## Precedência quando as fontes discordam

As fontes não concordam entre si (ex.: a `redesign-skill` sugere Geist, vidro e gradiente
mesh; a `frontend-design` e a `interface-design` tratam isso como default de IA; as guidelines
da Vercel pedem Title Case, as outras pedem sentence case). A ordem é:

1. **Decisão do projeto** — ADRs, `docs/project/ux-charter.md`, `docs/design-system/system.md`.
2. **Regras do kit** — `.claude/reference/frontend/anti-patterns.md` + `detect-cliches.mjs` e os registers. São a autoridade única de clichê; as fontes de terceiros as alimentam, não as substituem.
3. **Fontes de terceiros**, na ordem da tabela.

Regras específicas de idioma inglês das guidelines da Vercel (Title Case, "&" no lugar de
"and") não se aplicam a interfaces em outro idioma; no kit, títulos e botões usam sentence
case, salvo decisão do projeto.

## Fora do kit, de propósito

- **taste-skill v2** (direção de arte para páginas públicas): pesada (biblioteca de ~1,8 MB),
  exige Node 22 + Chrome e consulta a rede. Entra como **módulo opcional de marca**, instalado
  pelo `/setup` só quando o projeto tem superfície de marca e o usuário aceita.
- **soft-skill, minimalist-skill, brutalist-skill, gpt-tasteskill, stitch-skill**: estilos
  prontos que contradizem as regras do kit e entre si.
- **imagegen-\*, brandkit, image-to-code-skill**: dependem de ferramenta de geração de imagem.
