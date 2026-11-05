# Changelog

Todas as mudanças relevantes do kit são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.2.0] — 2026-11-05

### Loop Engineering — uma sessão por fatia é o caminho padrão (ADR-0007, revisão)
- **`/execute` não implementa mais na sessão principal.** Ela confere a Regra 0, solta o `loop-driver.mjs` em segundo plano, trata as paradas com o usuário pelo código de saída e faz o fechamento. Com o loop numa sessão só, cada chamada relia tudo o que veio antes; agora cada fatia nasce numa sessão vazia.
- **`loop-driver.mjs` reescrito como gerente do loop:** Gate 0 a cada iteração, próxima fatia liberada pelo grafo (`Depende de`), sessão da fatia no modelo aprovado, gates por exit code, verificador em outra sessão, uma segunda tentativa um degrau de modelo acima quando reprovada, continuação automática quando a sessão cai com trabalho feito, grupo multi-agente numa sessão só, `BLOCKED` que não para a rodada. Códigos de saída por motivo de parada (0 acabou · 3 decisão humana · 4 fora do contrato · 5 só BLOCKED · 6 reprovada duas vezes · 7 `--max`).
- **Sessão da fatia enxuta:** protocolo próprio (`slice-session.md`) em vez da skill inteira, recorte do pacote (`loop-briefing.mjs`) em vez de spec, plan e tasks inteiros, leitura de PRD e guia de validação bloqueada por regra de permissão.
- **Verificador em sessão separada** (`verifier-session.md`): sem o histórico de quem implementou e sem edição nem commit; critério a critério com evidência, check agents da camada, revisão visual, caça a teste afrouxado. Pode reprovar só parte de um grupo.
- **`slice-gates.mjs`:** roda a tabela Gates do `tasks.md` só nas camadas tocadas e decide pelo exit code; comando fora do PATH sai como falha de infraestrutura, não como defeito da fatia.
- **`tasks.md`:** linha **Modelo · esforço** por fatia (proposta pelo `@task-breaker`, aprovada no portão final do `/tasks`), coluna **Caminhos** na tabela Gates e tabela **"Custo por sessão (driver)"** (modelo, custo, pico de contexto, turnos, resultado de cada sessão). O custo sai do Log de iterações. Campos opcionais: `tasks.md` anterior a eles continua rodando.
- `--interativo` roda a fatia na sessão principal quando ela precisa do usuário no meio; `--checkpoint` passa a ser o driver com uma fatia por rodada; `--driver` deixa de existir como flag do `/execute`.

### Regras de prova — teste que não tem como falhar não prova a regra
- **Ausência com controle positivo:** cenário de "não acontece" sai em par com o caso vizinho em que acontece, para o mesmo destinatário. Sem o controle, o verificador reprova.
- **Efeito assíncrono provado no destino**, não pelo registro gravado; **esperado no que a ação produziu**, não no rótulo ou na mensagem de sucesso; **matriz de variação** por configuração e perfil que mudam o caminho.
- Revisão visual: a tela inteira, não só o componente da fatia; **sintoma funcional é achado, não sugestão**; defeito anterior à fatia vai para o relatório sem reprovar.
- Cenário que o ambiente local não fecha (provedor real, worker, rotina agendada) sai NÃO VERIFICADO com onde fecha, nunca como passou.
- Infra de Verificação: a persona de teste espelha a do ambiente real (papel e nível da permissão) e o destinatário do cenário tem como receber.
- Onde: `@task-breaker` e template de `tasks` (geração e checker da decomposição), sessão da fatia, verificador, `@planner` e template de `plan`.

### Correções
- `/frontend-validate` e `/backend-validate` despachavam os check agents em segundo plano: numa sessão não interativa o resultado se perdia. Agora vão na mesma mensagem, em paralelo, e aceitam a lista de arquivos como escopo.
- Gate 0: a checagem de ferramentas dos gates lê só a coluna Comandos.

## [0.1.1] — 2026-10-29

### Semente e distribuição
- Semente autossuficiente: `settings.json` pré-libera editar e criar os artefatos do kit (`docs/**`, `CLAUDE.md`, `.gitignore`, `.claude/skills|agents|evals/**`, `.claude/quality.json`) e `git status|diff|log|add|commit`. `git push` e os settings seguem fora da pré-liberação.
- Lock determinístico: `.claude/praxis.json` sai sem carimbo de data e com chaves ordenadas, para o diff de uma atualização mostrar só versão, hashes e pendências.
- Cache isolado por repositório (hash do `repo` na chave), para um fork e o catálogo original não se misturarem na mesma versão; cache cuja tag aponta para catálogo de outra versão é descartado e clonado de novo.
- `git` ausente no PATH deixa de ser reportado como falha de rede (`ENOENT` tratado à parte).
- Índice de ADRs com inserção em ordem numérica; título e data aceitam mais variações de formato.

## [0.1.0] — 2026-10-19 — primeira versão pública

### Distribuição — o kit se monta dentro do projeto (ADR-0009)
- O repositório é um **catálogo** (`catalog.json`, tag `vX.Y.Z`). O projeto instala a **semente** (`seed/`) e as ferramentas entram na hora do uso, sem o usuário pedir: `/start` monta o núcleo e puxa a trilha da linha de trabalho; `/setup` puxa os módulos da stack.
- `.claude/praxis/praxis.mjs` (`init`, `add`, `list`, `status`, `check`, `apply`, `diff`), lock em `.claude/praxis.json`, cache por máquina em `~/.claude/praxis/cache/`.
- **Atualização:** checagem diária em background; patch e minor aplicados pelo Praxis com o loop parado, num commit separado; major só com decisão do usuário; arquivo personalizado nunca é sobrescrito; `"pin"` congela a versão.
- `CLAUDE.md` do projeto importa as regras do kit (`.claude/praxis/rules.md`); o texto do projeto nunca é tocado pelo catálogo.
- Semente autossuficiente: `settings.json` pré-libera editar e criar os artefatos do kit (`docs/**`, `CLAUDE.md`, `.gitignore`, `.claude/skills|agents|evals/**`, `.claude/quality.json`) e `git status|diff|log|add|commit`. Código do projeto, settings e `git push` seguem o modo de permissão do usuário.
- `/forge`: o projeto cria as próprias ferramentas (check com eval, comando, subagente) nas convenções do kit.

### Orquestração
- 41 skills e 45 agents em 8 domínios (`orchestration`, `discovery`, `product`, `architecture`, `delivery`, `quality`, `frontend`, `backend`).
- **Praxis** ligado por padrão, na sessão principal: lê o manifesto, despacha a skill certa, interrompe quando vê risco e faz o handoff com o comando literal do próximo passo. Trilha mínima: `/start`, `/define`, `/implement`, `/quickfix`, `/debug`.
- Skills que conversam com o usuário rodam na sessão principal, com o agent como roteiro; subagentes fazem só o trabalho não interativo.

### Loop Engineering (ADR-0007)
- Pacote de informação fechada e ancorada no código (Fatos Confirmados `arquivo:linha`, Módulo de Referência, Decisões Fechadas/Diferidas, Armadilhas, critério de PRONTO por fatia).
- **Portão final do `/tasks`:** consistência, paradas prováveis eliminadas, cobertura de entendimento, índice de execução autônoma, Preflight e guia de validação.
- `/execute` autônomo por fatia vertical na sessão principal: test-first classificado (RED → CLASSIFY → JUSTIFY → GREEN → REFACTOR), micro-loop de conserto, verificador independente (check agents), watchdog anti-giro, status `ABANDONADA`, multi-agente opt-in por grupo, `--checkpoint` para parar a cada fatia.
- **Gate 0** (`loop-doctor.mjs`), **mutantes** (`mutants.mjs`), driver de sessão nova por fatia (`loop-driver.mjs`), `/verify-all` contra exit codes reais.

### Segurança (ADR-0008)
- Baseline OWASP + LGPD; verificadores de segurança por fatia; auditoria de dependências por delta (`deps-audit.mjs`); scan da branch no fechamento pelo plugin Claude Security (declarado, não copiado).

### Front
- Âncora de design: Charter **ou** memória de design do projeto (`docs/design-system/system.md`).
- `/ux`, `/design` e `/prototype` na sessão principal; protótipo opcional, no destino que a sessão tiver (ferramenta de protótipo, Artifact ou HTML local).
- Fontes de terceiros fixadas em `.claude/reference/frontend/third-party/` (interface-design, frontend-design, web-interface-guidelines, design-review com Playwright, auditoria da redesign-skill) — `THIRD_PARTY_NOTICES.md`.
- `@check-web-guidelines`, `detect-cliches.mjs`, `screenshot.mjs`, adapters de stack e módulo de marca opcional.

### Qualidade do kit
- **Agent evals** (`/agent-eval`, `.claude/evals/agents/`): 6 agents, linha de base 18/18.
- Hooks de aprendizado (ledger versionado só com linhas semânticas; o automático fica local) e hooks de qualidade **opt-in**.
- CI: `validate-kit` (frontmatter, grafo de dependências completo, JSON, evals, caminhos pessoais), índice/catálogo e semente conferidos com `--check`.
