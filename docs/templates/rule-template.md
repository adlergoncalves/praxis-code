---
paths: ["src/**/*.tsx", "src/**/*.ts"]
dominio: frontend
medido_em: 2026-01-01
derruba_com: "grep -rn \"navigate(\" src/ | confrontar com as rotas declaradas em src/app/routes.tsx"
vale_enquanto: "as rotas sao declaradas num unico arquivo (src/app/routes.tsx)"
check: "manual"
origem: "docs/project/learnings/frontend-learnings.md#2026-01-01"
---
**Regra**: toda chamada `navigate('/x')` ou `<Link to="/x">` aponta para rota declarada no roteador; rota nova entra no roteador na mesma fatia.
**Escopo**: todo o frontend — telas, componentes compartilhados, menus e redirecionamentos.
**Fonte**: src/app/routes.tsx:12
**Por que**: o usuario corrigiu um 404 silencioso em producao; o roteador nao acusa rota inexistente em build.

<!--
MOLDE DE REGRA ATIVA (ADR-0010). Copie para `.claude/rules/learned/<dominio>-<slug>.md` e APAGUE este comentario:
o Claude Code carrega todo .md de `.claude/rules/` — o arquivo gravado e so frontmatter + as 2 a 5 linhas do corpo.

Frontmatter (o Claude Code le so `paths`; o resto e removido antes de ir ao contexto e serve ao memory-check):
- paths         globs da AREA em que a regra vale (relativos a raiz). Carrega quando um arquivo que casa e lido,
                escrito ou editado — na sessao principal, nos subagentes e nas sessoes do driver. Regra de negocio:
                ["docs/specs/**", "docs/prds/**"]. OMITIR so quando a regra vale em qualquer trabalho: ela passa a
                custar contexto em TODA sessao (orcamento: PRAXIS_RULES_SEMPRE_MAX, padrao 10).
- dominio       frontend | backend | business | architecture | process (mesmo prefixo do nome do arquivo)
- medido_em     AAAA-MM-DD da ultima vez que alguem conferiu que a regra ainda vale (vence em PRAXIS_RULE_MAX_DIAS, padrao 90)
- derruba_com   comando, arquivo ou pergunta que PROVA que a regra deixou de valer ("ja foi resolvido?")
- vale_enquanto premissa que, se cair, leva a regra junto ("isto ainda quer dizer alguma coisa?")
- check         quem cobre a regra no codigo: nome do check/script (ex.: "check-learnings.mjs:navigate-route",
                "check-audit") ou "manual"
- origem        entrada de evidencia em docs/project/learnings/<dominio>-learnings.md#<data da entrada>

Corpo (2 a 5 linhas; o memory-check reprova acima de 8):
- **Regra**   imperativo, sem ambiguidade — e o que o agente le
- **Escopo**  onde mais se aplica (modulos, tipos de tela, classe de codigo). NUNCA "neste componente":
              escopo restrito ao caso pontual e o que faz a regra regredir
- **Fonte**   arquivo:linha que sustenta a regra (0..n, separados por virgula; "—" quando nao ha). Conferida antes
              de aplicar: se o codigo contradiz, a regra nao se aplica e e DERRUBADA (arquivo sai da pasta; a entrada
              de origem registra data e motivo). O memory-check acusa fonte morta.
- **Por que** uma linha de contexto (a correcao, o incidente)

Nome do arquivo: <dominio>-<slug>.md (ex.: frontend-rota-declarada.md). Derrubar = remover o arquivo + registrar na
origem; nunca editar a regra para "amaciar". Consolidada em ADR: a regra sai e a ADR vira a fonte.
-->
