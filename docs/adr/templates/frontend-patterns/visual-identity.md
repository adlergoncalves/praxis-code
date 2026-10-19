# ADR-{NNNN}: Identidade Visual e Charter

## Status
Template (nao adotada — personalizar via /architect)

## Contexto

{Por que o projeto precisa de uma identidade visual ancorada — defaults genericos saem como "SaaS-template feito por IA"; sem ancora narrativa, telas inconsistentes e decisoes sem razao. Esta ADR registra o Charter do produto (single source of truth da identidade) e as regras que dele derivam.}

## Decisao

### Register
{`brand` | `product` | hibrido: surface X = brand, surface Y = product}

**Por que esse register**: {1-2 frases — qual a natureza da superficie principal e o que isso muda nos defaults}.

### Arquetipo (referencia: `.claude/reference/frontend/personas.md`)
- **Dominante** ({percentual}%): {arquetipo — Preciso / Polido / Amigavel / Luxuoso / Ludico / Utilitario}
- **Secundario** ({percentual}%, se hibrido): {arquetipo}

### Ancora de design (single source of truth)
- **Path**: `docs/project/ux-charter.md` (Charter, se existir) **ou** `docs/design-system/system.md` (memoria de design: Register, Direcao, Dominio)
- **Conteudo**: register, arquetipo, atributos da personalidade, referencias, anti-referencias, scene, principios, a11y.
- **Esta ADR aponta para a ancora** — NUNCA duplica conteudo. Toda decisao de UI/UX deve ser citavel de volta a um atributo do Charter ou a Direcao/Dominio da memoria de design.

### Atributos da personalidade (4-6, do Charter)
{Lista curta — ex.: "preciso, denso, sem ornamento, direto, keyboard-first, sobrio"}

### Referencias positivas
{2-4 produtos que encarnam essa personalidade — extraidos do Charter, com o que ESPECIFICAMENTE em cada}

### Anti-referencias (o que NAO somos)
{2-3 produtos que esse NAO deve parecer — com razao}

### Scene sentence
{Quem usa, onde, sob que luz, em que humor — uma frase do Charter}

### Acessibilidade
- **WCAG**: {AA | AAA}
- **Acomodacoes conhecidas**: {reduced-motion, color-blindness, screen reader heavy, etc.}

### Stack adapter
- **Stack do projeto**: {react-vite-shadcn | react-next-shadcn | angular-material | vue-vuetify | outra}
- **Adapter casado**: `.claude/reference/frontend/adapter-{stack}.md` (carregado por todos os agents de front).
- **`stack-profile.json`**: `docs/design-system/stack-profile.json` (materializado por `/ds-init`).

## Alternativas Consideradas

### {Arquetipo alternativo 1}
- **Pros**: ...
- **Contras**: por que nao casa com o produto/audiencia

### {Arquetipo alternativo 2}
- **Pros**: ...
- **Contras**: ...

## Consequencias

### Positivas
- Toda decisao visual ancorada num atributo do Charter — citacao explicita, nao opiniao.
- `@check-visual-consistency` valida features contra o Charter; drift e detectado.
- `@check-ai-cliches` usa o Charter para modular severidade (gradiente em brand intencional != gradiente em product slop).
- `/design <modo>` opera no codigo respeitando o Charter; refinos justificados.
- `/ds-init` extrai tokens **com intencao**, nao com defaults da lib.

### Negativas
- Overhead inicial: ter uma ancora de design antes de tocar codigo de UI — o Charter (`/ux charter`) ou a exploracao do dominio gravada na memoria (`/ux shape`, `/ux direcao`) (gate no `/execute`).
- Charter precisa ser revisado quando audiencia/posicionamento muda — risco de stale.

## Regras para Validacao

### Charter
- OBRIGATORIO: existe **ancora de design** — `docs/project/ux-charter.md` com `## Register` **ou** `docs/design-system/system.md` com Register, Direcao e Dominio preenchidos.
- OBRIGATORIO: gate de frontend do `/execute` valida ancora + Shape antes de concluir feature de front.

### Register
- OBRIGATORIO: defaults seguem `register-{brand|product}.md` casado.
- PROIBIDO: misturar register sem declaracao por-surface.

### Anti-referencias
- PROIBIDO: padroes listados em `anti-references` do Charter (ex.: "hero metric row", "gradient roxo-azul SaaS").
- O `@check-ai-cliches` detecta automaticamente os mais comuns.

### Referencias positivas
- PREFERIDO: tracar paralelos com as referencias citadas no Charter ao decidir patterns/microinteracoes.

### Decisoes ancoradas
- OBRIGATORIO: cada decisao significativa de UI/UX em commit message ou spec cita o atributo do Charter ou a Direcao/Dominio da memoria de design que a justifica.
- Se nao puder citar → revisar a decisao OU revisar a ancora (atributo faltando).

### Manutencao
- Revisar Charter quando: audiencia muda; reposicionamento estrategico; multipla feedback indicando "marca nao consolida".
- NAO revisar a cada feature — Charter e ancora ampla.
