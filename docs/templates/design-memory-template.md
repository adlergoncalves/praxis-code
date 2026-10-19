# Memória de design — {Projeto}

> **O que é.** As decisões visuais **deste** projeto, gravadas à medida que são tomadas. É o que
> transforma o kit de generalista em especialista no projeto: a próxima tela parte daqui, não do
> default. Vive em `docs/design-system/system.md`.
>
> **Quem escreve**: `/ux` (direção aprovada), `/design` (decisão de refino), `/ds-init`
> (fundação), `/execute` (padrão de componente usado 2+ vezes numa fatia de UI). **Quem lê**: todo
> agent e skill de front antes de propor, construir ou revisar — o que está aqui é **decisão**, não
> achado de review.
>
> Método e molde de origem: `.claude/reference/frontend/third-party/interface-design/`
> (seções "Product Domain Exploration", "Craft Foundations" e `system-template.md`).

---

## Direção

> **Âncora de design.** Register + Direção + Domínio preenchidos fazem desta memória uma âncora
> válida, no lugar do Charter (`docs/project/ux-charter.md`) — os gates de front aceitam um **ou** outro.

- **Register**: {product | brand | híbrido: superfície X = brand, superfície Y = product}
- **Quem usa e para quê**: {o humano real, onde está, o verbo principal}
- **Sensação**: {em palavras que significam algo — "denso como um terminal", "calmo como um caderno"}
- **Personalidade (arquétipo, `.claude/reference/frontend/personas.md`)**: {Preciso | Confiante | Amigável | Luxuoso | Lúdico | Utilitário} ({%}) + secundário, se houver
- **Base**: {quente | fria | neutra | tingida} · **Profundidade**: {só bordas | sombras sutis | sombras em camadas | degraus de superfície} — uma só

## Domínio (de onde vêm as escolhas)

- **Conceitos do mundo do produto** (5+): {…}
- **Mundo de cor** (5+ cores que existem nesse mundo): {…}
- **Assinatura**: {o elemento que só poderia existir neste produto — e onde ele aparece}
- **Defaults rejeitados**: {default → alternativa escolhida} ×3

## Tokens

- **Espaçamento**: base {4 | 8}px · escala {…} · densidade {px de padding de painel/card}
- **Cor** (nomes do domínio, não `--gray-700`): {--token: valor — papel}
- **Raio**: {escala} · **Profundidade**: {valores}
- **Tipografia**: família {…} (por quê) · razão da escala {1.2 | 1.25 | 1.333} · pesos {…} · rampa de texto em 4 níveis {primário, secundário, terciário, apagado}

## Padrões de componente

> Entra quando o componente é usado 2+ vezes, é reutilizável ou tem medidas que vale lembrar.

### {Componente — variante}
- {altura · padding · raio · tipo/peso · cor · uso}

## Telas aprovadas (padrões de tela do projeto)

> Direção ou tela que o usuário aprovou vira referência para a próxima tela do mesmo tipo.
> Consistência primeiro; novidade só quando o tipo de tela é novo.

| Tipo de tela | Tela de referência | Composição em 1 linha | Fonte (protótipo / rota / print) | Aprovada em |
|---|---|---|---|---|
| {lista de trabalho} | {rota} | {foco, ritmo, assinatura} | {…} | {data} |

## Decisões

| Decisão | Motivo | Data |
|---|---|---|
| {…} | {…} | {…} |

## Recusas (o que este projeto não quer)

| Proposta recusada | Por quê | Data |
|---|---|---|
| {…} | {…} | {…} |
