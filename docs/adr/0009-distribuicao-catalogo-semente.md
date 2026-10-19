# ADR-0009: Distribuição por catálogo e semente — o kit se monta dentro do projeto

**Status:** Aceito
**Data:** 2026-10-19
**Decisores:** Adler (dev)
**Escopo:** Como o kit chega a um projeto, como as ferramentas entram nele e como são atualizadas. Vale para todo projeto que usa o kit e para o desenvolvimento do próprio kit.

---

## Contexto e Problema

Distribuir o kit como **template de repositório** — a pessoa clona tudo (dezenas de skills e agents, scripts, referências) e um setup remove módulos inteiros — contraria a ideia do kit:

1. **O kit é genérico para se adaptar a qualquer projeto, não para ser usado como genérico.** Dentro de um projeto ele vira o motor daquele projeto: cresce com ele, se especializa com os learnings, o manifesto, as ADRs e a memória de design. As ferramentas genéricas que não servem àquele projeto são lixo lá dentro — e ainda custam contexto, porque o Claude Code carrega o nome e a descrição de toda skill e agent em cada sessão.
2. **99% das pessoas usam o kit, não mexem no kit.** Quem usa não deve precisar conhecer o catálogo, decidir o que instalar nem saber montar um harness. O próprio kit cuida disso.
3. **Quem usa precisa ser dono do que tem.** Personalizar uma ferramenta é editar o arquivo; a ferramenta nova do projeto nasce ao lado das do kit, nas mesmas convenções.

Plugins e marketplaces do Claude Code foram avaliados e descartados (ver Alternativas): mantêm o motor fora do projeto, prefixam os comandos, exigem instalação por pessoa e não têm forma documentada de o projeto sobrescrever uma ferramenta.

---

## Decisão

O repositório `praxis-code` é um **catálogo**. O projeto recebe uma **semente** pequena e, a partir dela, **puxa as ferramentas na hora do uso**, sem o usuário pedir e sem anúncio. O que o projeto tem no fim é o praxis dele: arquivos próprios, versionados com o projeto, editáveis.

### Entidades

| Entidade | O que é | Onde vive |
|---|---|---|
| **Catálogo** | O repositório do kit, numa **tag** `vX.Y.Z`. O `catalog.json` (gerado) lista cada ferramenta com tipo, arquivos, hash e dependências. | `https://github.com/adlergoncalves/praxis-code` |
| **Ferramenta** | Unidade que se puxa: `skill`, `agent`, `asset` (template, referência, script, hook, ADR do kit) ou `group` (pasta que só faz sentido inteira, ex.: `third-party/`). | catálogo → projeto |
| **Semente** | O mínimo para o primeiro `/start`: `CLAUDE.md`, `.claude/praxis/` (`praxis.mjs`, `rules.md`), `.claude/praxis.json`, `.claude/settings.json`, a skill `/start`. Gerada do catálogo por `scripts/build-seed.mjs` e versionada em `seed/`. | `seed/` no catálogo |
| **Lock** | `.claude/praxis.json`: repo, versão do catálogo, pino opcional, cada ferramenta instalada com seus arquivos e hashes, pendências de atualização. **É a única fonte de "o que é do kit" no projeto.** | projeto, versionado |
| **Cache** | Clone raso do catálogo por versão, compartilhado entre projetos da máquina. | `~/.claude/praxis/cache/<versão>/` |
| **Do projeto** | Tudo que não está no lock: `CLAUDE.md` (depois da semente), `docs/project/*` exceto `learnings/README.md`, ADRs do projeto, specs, memória de design, ferramentas criadas pelo projeto. **Nunca tocado por atualização.** | projeto |

### Instalação

```bash
npx degit adlergoncalves/praxis-code/seed meu-projeto   # projeto novo
npx degit adlergoncalves/praxis-code/seed /tmp/praxis && cp -rn /tmp/praxis/. .   # projeto existente
```

Depois, no Claude Code, `/start`. O primeiro `/start` roda `praxis.mjs init`: clona a versão da semente para o cache e puxa o **núcleo** (Praxis, `/mode`, `/setup`, hooks de aprendizado, `docs/project/` e o `learnings/README.md`). A semente não traz o núcleo para não duplicar arquivo no catálogo.

### Puxar na hora do uso

1. O Praxis (ou `/start`) despacha uma skill. Se ela não existe em `.claude/skills/`, roda `node .claude/praxis/praxis.mjs add <skill>` e segue. O script resolve o fecho das dependências pelo `catalog.json`, copia do cache, confere o hash de cada arquivo e grava no lock.
2. **Sem pergunta e sem anúncio.** Fica no lock e numa linha `(auto)` do ledger. O usuário só ouve falar quando falha (sem rede na primeira vez, repo fora do ar): uma linha com o comando manual.
3. A `settings.json` da semente libera a permissão de Bash **só** para o `praxis.mjs`; sem isso o "transparente" morreria no pedido de permissão.
4. O `/start` puxa de uma vez a **trilha da linha escolhida** (ex.: Linha 1 → `/discovery`, `/architect`, `/define`, `/implement`, `/validate` e dependências), para o caminho comum já estar presente.
5. O `rules.md` manda o assistente puxar qualquer comando do catálogo que não exista localmente, mesmo com o Praxis desligado (`/mode praxis off`).
6. O `/setup` não remove nada: puxa o módulo de stack (frontend, backend) que as respostas indicarem e oferece os opt-ins (hooks de qualidade, módulo de marca).

### Atualização

- **Unidade de atualização é a versão do catálogo**, nunca ferramenta avulsa: tudo que veio do kit está na mesma tag. É o que impede "template novo com parser velho" entre `tasks.md`, `loop-doctor` e `loop-driver`.
- **Descoberta sem travar:** o hook `reconcile.mjs` (só no `SessionStart`, nunca no `UserPromptSubmit`) dispara, no máximo uma vez por dia, um processo desacoplado que roda `praxis.mjs check`: `git ls-remote --tags` com timeout, clone da versão nova para o cache e marcador local `.claude/praxis.update.json` ("atualização X pronta: n arquivos, m personalizados"), que o hook lê e injeta como contexto no início da sessão seguinte. O hook não escreve arquivo do kit e não faz commit.
- **Aplicação por SemVer:** patch e minor são aplicados pelo **Praxis** no início da sessão, em **momento seguro** (nenhuma fatia `WIP` em nenhum `tasks.md`), com `praxis.mjs apply`. Major nunca sozinho: o Praxis avisa uma vez, com o changelog, e o usuário decide (`apply --major`). O script recusa `apply` com fatia `WIP` ou em major sem a flag — a regra vale mesmo se o modelo errar.
- **Arquivo não modificado é substituído; personalizado é mantido** e fica no lock como pendente, com `praxis.mjs diff <ferramenta>` disponível. Nada é sobrescrito nem mesclado sozinho.
- **Novas ferramentas não entram no update**, só no uso; o catálogo atualizado é o que faz o Praxis saber que existem. Ferramenta removida do catálogo continua no projeto e aparece em `status`.
- **Commit separado** pelo Praxis, pela política de commit do projeto (`chore(praxis): catálogo 0.1.0 → 0.1.2`); se houver trabalho pendente na árvore, só aplica e registra no ledger. Reversível pelo git nos dois casos.
- **Pino:** `"pin": "0.1.0"` no lock congela a versão; `check` ignora tags acima do pino. É a saída para quem não quer atualização automática, sem fork.
- **Variáveis de ambiente:** `PRAXIS_DRIVER=1` (exportada pelo `loop-driver.mjs` para cada sessão `claude -p`) e `PRAXIS_OFFLINE=1` desligam `check` e `apply`.
- **Regras do kit no projeto:** o `CLAUDE.md` do projeto importa `@.claude/praxis/rules.md`, que é do kit e atualiza; o texto do projeto fica no `CLAUDE.md` e nunca é tocado.

### Invariantes

1. Tudo que veio do kit está na **mesma versão** (lock).
2. **Proveniência só no lock.** O arquivo copiado é byte a byte igual ao catálogo; "personalizado" é `sha256` atual diferente do lock, calculado com fim de linha normalizado para LF (o `autocrlf` do Windows não pode marcar tudo como editado).
3. **"Do kit" é lista no lock, não diretório.** `docs/project/learnings/README.md` e `docs/templates/*` são do kit; `manifest.md`, `*-learnings.md` e `ledger.md` são do projeto desde a semente.
4. **Toda ferramenta do catálogo é autocontida pelo grafo:** cada caminho que uma skill, agent ou asset cita está no seu `depends` (ou no fecho dele). `generate-index` emite o `catalog.json` com arquivos, hashes e dependências; `validate-kit` reprova citação fora do grafo. É o que torna o "puxar" confiável.
5. **Formato lido por script muda só em major** (`tasks.md`, `doctor.json`, lock, `state.md`). É o que torna patch e minor seguros de aplicar sozinhos.
6. **Concorrência:** `add` e `apply` usam um lock de arquivo (`.claude/praxis.lock`, local) para duas sessões no mesmo projeto não escreverem juntas.
7. **Sem rede, nada quebra:** `check` falha em silêncio e tenta no dia seguinte; `add` de ferramenta já no cache funciona offline.

### Não-objetivos

- Plugin ou marketplace do Claude Code (avaliados e descartados).
- Mesclar automaticamente uma personalização com a versão nova (é diff + decisão humana, como no shadcn).
- Fork obrigatório por empresa (o pino cobre o caso; fork continua possível, porque o repo do lock é configurável).
- Publicação no npm (o `degit` basta).
- Desinstalar ferramenta (`remove`) — pode vir depois; hoje a ferramenta puxada fica.

---

## Alternativas Consideradas

### 1. Template inteiro
Simples de instalar, mas carrega o kit todo em cada projeto: custo de contexto fixo, lixo, e o `/setup` só corta módulo inteiro. Contraria "generalista para se adaptar, não para ser usado como genérico".

### 2. Plugins num marketplace do Claude Code
Nativo e versionado, mas o motor fica **fora** do projeto. Conforme a documentação oficial: comandos ganham prefixo (`/praxis:start`, `@agent-praxis:x`), todo caminho precisa ser reescrito para `${CLAUDE_PLUGIN_ROOT}`, cada pessoa instala uma vez por projeto, o `CLAUDE.md` do plugin não é carregado e não há forma documentada de o projeto sobrescrever uma skill ou agent do plugin. O projeto não vira dono do próprio harness.

### 3. CLI manual tipo shadcn puro
É este modelo sem o "transparente": a pessoa precisaria saber o que pedir. O Praxis é o que remove essa carga.

---

## Consequências

### Positivas
- O projeto só carrega o que usa; sem lixo e sem custo fixo de contexto.
- O projeto é dono do harness: funciona em clone, CI e offline; personalizar é editar o arquivo.
- Correções do kit chegam aos projetos (patch e minor sozinhos, major com decisão), sem sobrescrever personalização.
- Uma empresa fixa a versão com o pino; não precisa de fork.

### Negativas
- O repositório do kit vira dependência de runtime de todo projeto na primeira instalação e nas atualizações (mitigado: cache por máquina, pino, `PRAXIS_OFFLINE`).
- Personalização diverge do catálogo e para de receber a atualização daquele arquivo (é o preço de ser dono; o diff fica disponível).
- Trabalho de base no kit: completar o grafo de dependências e manter `catalog.json` e `seed/` gerados e conferidos no CI.

---

## Regras para o desenvolvimento do kit

- OBRIGATÓRIO: toda ferramenta nova declara `depends` cobrindo cada caminho que cita; `validate-kit` reprova o contrário.
- OBRIGATÓRIO: `catalog.json` e `seed/` são gerados (`generate-index`, `build-seed`) e conferidos com `--check` no CI; nunca editados à mão.
- OBRIGATÓRIO: mudança em formato lido por script é **major**, registrada no CHANGELOG.
- PROIBIDO: skill, agent ou hook que grave arquivo do kit fora de `praxis.mjs`.
- PROIBIDO: hook que faça commit no repositório do projeto.

> Esta ADR não traz "Regras para Validação" de código: ela governa o kit, não a aplicação.

---

## Critério de aceite

1. `validate-kit` reprova citação fora do grafo e passa com o grafo completo; `catalog.json` traz tipo, arquivos, hashes e dependências de cada ferramenta.
2. `praxis.mjs` com `init`, `add`, `list`, `status`, `check`, `apply`, `diff`, lock e cache, testado com um catálogo local (clone por caminho) e com os casos: ferramenta ausente, arquivo personalizado, versão nova (patch e major), fatia `WIP`, offline.
3. Semente gerada e conferida no CI; `/start` puxa a trilha da linha; o Praxis e o `rules.md` puxam comando ausente; o hook dispara o `check` diário sem bloquear o início da sessão.
4. `/setup` puxa módulos em vez de remover.
5. Skill de criar ferramenta do projeto nas convenções do kit, registrada no lock como do projeto.
6. Instalação pela semente num projeto real, com o loop rodando até o fechamento e uma atualização patch aplicada numa sessão posterior.
