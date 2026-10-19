---
description: "Setup interativo do kit Praxis — pergunta stack e modulos, puxa do catalogo so o que o projeto usa e preenche a secao do projeto no CLAUDE.md."
user-invocable: true
depends:
  - .claude/hooks/quality
---

# /setup

Configura o kit para um projeto especifico. Pergunta a stack, **puxa do catalogo os modulos que se aplicam** (ADR-0009 — nada e removido: o que nao se aplica simplesmente nao entra) e preenche a secao `## Projeto` do `CLAUDE.md`.

## Quando usar

- No primeiro `/start` de um projeto novo (o `/start` chama o `/setup` se ainda nao rodou)
- Ao adotar o kit num projeto existente (o `/adopt` confere a instalacao antes)

## Execucao

### Passo 1 — Perguntas de setup

Perguntar ao usuario, uma por vez:

1. **Nome do projeto**: Como se chama o projeto?
2. **Linha de trabalho**:
   - Novo software (construir do zero)
   - Modernizar legado (reconstruir sistema existente)
   - Adotar projeto existente (organizar projeto em andamento)
3. **Stack frontend**: (nenhum / React / Vue / Angular / outro)
4. **Stack backend**: (nenhum / .NET / Java / Node / Python / outro)
5. **Banco de dados**: (nenhum / PostgreSQL / MySQL / MongoDB / outro)
6. **Design System**: O projeto tera Design System? (s/n) — so perguntar se tem frontend
7. **Porte do projeto**: Pequeno/MVP ou Medio/Grande?
   → Pequeno: configurar modo lite automaticamente (apos setup)
   → Medio/Grande: manter modo full (default)
8. **Dominio complexo?** Varios modulos interdependentes, termos que mudam de sentido entre areas, mais de um time? (s/n) → decide o modulo `ddd`
9. **Superficie de marca** (so se tem frontend): o projeto tem landing, site institucional ou outra pagina publica? Se sim, oferecer o **modulo de marca** (taste-skill v2) com a implicacao: direcao de arte melhor para paginas publicas; exige Node 22+, Chrome/Edge/Chromium e acesso a rede; ~1,8 MB de biblioteca. Default: nao instalar.
10. **Hooks de qualidade** (opt-in): a cada edicao, formatar, lintar e rodar o teste ao lado do arquivo, e pedir confirmacao antes de editar caminho critico (ADRs, pipelines, configuracao do kit). Implicacao: **executam comandos do projeto** (diferente dos hooks de aprendizado, que so gravam em `docs/project/` e num cursor local); seguram o loop autonomo no instante do erro e impedem que ele reescreva um ADR sem supervisao. Default: recomendar ligar quando o projeto vai rodar o `/execute` autonomo.

### Passo 2 — Preencher a secao do projeto no CLAUDE.md

O `CLAUDE.md` do projeto importa as regras do kit (`@.claude/praxis/rules.md`, do kit, atualizado pelo catalogo) e tem a secao `## Projeto`, que e do projeto. **Este CLAUDE.md vai CRESCER com o projeto** — cada fase do pipeline enriquece a secao do projeto.

Preencher em `## Projeto` (nunca mexer no import nem copiar as regras do kit para ca):
- **Identificacao** — nome, descricao em uma linha, linha de trabalho
- **Stack** — tabela (frontend, backend, db, infra)
- **Modulos do kit** — os que foram puxados no Passo 3, uma linha
- Manter os marcadores `<!-- EVOLUI: ... -->` — `/discovery`, `/architect` e `/ds-init` inserem ponteiros neles

**REGRA DE TAMANHO**: o `CLAUDE.md` deve ficar abaixo de ~4KB (o import conta). So regras e ponteiros curtos (1-2 linhas por artefato). Detalhes completos vao para o manifesto. Ao enriquecer, as skills conferem o tamanho; passou → mover o detalhe para o manifesto e deixar ponteiro.

Projeto que **ja tinha** `CLAUDE.md` proprio (adocao): acrescentar o import e a secao, sem reescrever o texto do dono do projeto — e perguntar antes de mover qualquer coisa para o manifesto.

### Passo 2b — Inicializar Manifesto

Atualizar `docs/project/manifest.md` com:
- Linha de trabalho escolhida
- Stack preenchida
- Setup → `completo`

### Passo 3 — Puxar os modulos do catalogo

Com as respostas, rodar (sem perguntar de novo; cada comando e idempotente):

| Resposta | Comando |
|---|---|
| Tem frontend | `node .claude/praxis/praxis.mjs add --module frontend` |
| Tem frontend e quer DS | `node .claude/praxis/praxis.mjs add --module design-system` |
| Tem backend OO (.NET, Java, Node, Python com camadas) | `node .claude/praxis/praxis.mjs add --module backend` |
| Dominio complexo | `node .claude/praxis/praxis.mjs add --module ddd` |

A trilha da linha de trabalho (`linha-novo`, `linha-legado`, `linha-adocao`) e puxada pelo `/start`. O que nao se aplica **nao e puxado** — e, se mais tarde o Praxis despachar uma skill ausente, ela entra sozinha (regra em `.claude/praxis/rules.md`).

### Passo 3b — Modulo de marca (so se aceito no Passo 1)

Instalar a taste-skill v2 **fixada em commit** (`f624f37a8c650b9cc550253104925efe4c8de246`, o mesmo registrado no README de `third-party/`), num diretorio temporario fora do projeto, e copiar so a skill:

```bash
git clone --filter=blob:none https://github.com/Leonxlnx/taste-skill.git <tmp>/taste-skill
git -C <tmp>/taste-skill checkout f624f37a8c650b9cc550253104925efe4c8de246
# copiar <tmp>/taste-skill/skills/taste-skill  →  .claude/skills/taste-skill/
# copiar <tmp>/taste-skill/LICENSE             →  .claude/skills/taste-skill/LICENSE
```

Cada comando passa pelo pedido de permissao normal do Claude Code. Registrar no manifesto (Configuracao): `taste-skill v2 — instalada pelo /setup em {data}, commit f624f37`. Os scripts dela gravam em `.taste-skill/`: acrescentar essa pasta ao `.gitignore` do projeto. A taste-skill e do projeto (nao esta no lock): o catalogo nunca a toca.

### Passo 3c — Hooks de qualidade (so se aceito no Passo 1)

1. **Gerar `.claude/quality.json`** a partir de `.claude/hooks/quality/quality.example.json`, mantendo so as regras da stack do projeto e so comandos de ferramentas que **ja existem** no projeto (conferir `package.json`/dependencias, `dotnet`, `ruff`...). Nao instalar ferramenta para isso. Mostrar o arquivo ao usuario antes de gravar.
2. **Ligar os hooks**: fazer o merge do bloco `hooks` de `.claude/hooks/quality/hooks.quality.json` em `.claude/settings.local.json` (criar se nao existir; preservar o que ja houver; acrescentar aos arrays de `PreToolUse`/`PostToolUse`, sem duplicar). **Nunca** no `.claude/settings.json` versionado.
3. Registrar no manifesto (Configuracao): hooks de qualidade ligados, data.

### Passo 4 — Proximos passos

- Se o `/setup` foi chamado pelo `/start`: devolver o controle ao `/start`, que puxa a trilha da linha e indica o primeiro comando.
- Se foi chamado direto: "Agora rode `/start` para iniciar o pipeline correto para sua situacao."

## Regras

- NAO assumir stack — sempre perguntar
- NAO remover nada: o kit se monta por adicao; ferramenta que o projeto nao usa simplesmente nao e puxada
- NAO copiar as regras do kit para o `CLAUDE.md` do projeto — elas vem do import e sao atualizadas pelo catalogo
- Preencher a secao do projeto com conteudo real, nao com placeholders
- Listar ao final o que foi puxado (`node .claude/praxis/praxis.mjs status`) para transparencia
