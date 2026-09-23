# Implementation Plan: {Titulo da Feature}

**Spec**: [{nome}](../spec.md)
**Created**: {YYYY-MM-DD}
**Status**: Draft

> **Loop Engineering (ADR-0007).** Este plan carrega o **grounding no código** que
> impede o executor de re-adivinhar: **Fatos Confirmados (`arquivo:linha`)** e
> **Módulo de Referência**. Quando a demanda tem e2e, carrega também a **Infra de
> Verificação** como pré-condição. Regra dura: **nada de "confirmar depois"** — todo
> fato é pinado com referência real (confirmado via grep / `@codebase-mapper`).

---

## Summary (OBRIGATORIO)

{Resumo da spec + abordagem tecnica escolhida}

---

## Módulo de Referência (OBRIGATORIO)

> O exemplar concreto existente que esta demanda **copia o estilo** (não a forma). O
> loop é muito mais assertivo copiando um exemplar real do que inventando a forma.
> Escolhido pela **forma da demanda** (CRUD? motor de aprovação? wizard?).

| Forma desta demanda | Módulo/feature de referência | Path(s) |
|---|---|---|
| {ex: motor de aprovação backend} | {ex: KYC} | {backend/src/Modules/.../Kyc/} |
| {ex: fila/parecer frontend} | {ex: feature kyc} | {frontend/src/features/kyc/} |

> Se não existe exemplar próximo, declarar: **"Demanda sem módulo de referência —
> construir do zero seguindo ADRs + Design System"**.

---

## Fatos Confirmados no codebase (OBRIGATORIO)

> Valor real + `arquivo:linha`, confirmado por grep/`@codebase-mapper` na geração do
> plan. O loop **usa o valor, não re-adivinha**. É a maior alavanca de assertividade.
> Preencher só as linhas que a demanda toca (footprint).

| Fato | Valor real | Referência (`arquivo:linha`) |
|---|---|---|
| Faixa de `ErrorCode`/código de erro livre do módulo | {ex: E11-07-*} | {*Errors.cs:NN} |
| Código HTTP de validação/erro (422 vs 400; not-found 204 vs 404) | {...} | {middleware / módulo de ref} |
| Valores reais dos enums relevantes | {X=1, Y=2...} | {arquivo:linha} |
| Tipo de regra RBAC + nomes de role/scope | {...} | {RulesSeeder.cs:NN} |
| Base config de entidade (soft delete/auditoria já aplicados?) | {sim/não} | {arquivo:linha} |
| Projeto de testes onde os testes desta demanda entram | {existe? path} | {tests/.../} |
| Interface/contrato base (ex: `IUseCase<,>`, hook pattern) | {assinatura} | {arquivo:linha} |
| {outro fato a confirmar} | {...} | {...} |

> **Regra de geração**: nunca afirmar um fato do código sem `arquivo:linha` confirmado.
> Na dúvida, vira pergunta (`[REQUER CONFIRMACAO]`) — não chuta.

---

## Technical Context (OBRIGATORIO)

| Aspecto | Detalhe |
|---------|---------|
| Language/Version | {ex: TypeScript 5.x, C# 12} |
| Dependencies | {libs principais} |
| Storage | {banco, cache} |
| Testing | {framework, coverage target} |

---

## Project Structure (OBRIGATORIO)

```
{Estrutura de pastas relevante}
```

---

<!-- Secoes condicionais abaixo — incluir conforme footprint -->

## Data Model (se toca domínio/banco)
Ver [data-model.md](./data-model.md)

## Seguranca de Banco (OBRIGATORIO se stack BaaS)
{policies por tabela, CORS, claims JWT — ver skill /plan}

## Contracts (se toca API/contrato)
Ver [contracts/](./contracts/)

## Infra de Verificação (OBRIGATORIO se a demanda tem e2e)

> Pré-condição para o gate e2e/integração ser assertivo. Enumerar — não descobrir no
> meio do loop — toda persona/auth/fixture/seed/scope que os testes de aceite exigem.

### Personas / auth-setups

| Persona | Capacidade | Setup (existe? criar?) | storageState |
|---|---|---|---|
| {...} | {gerenciar/leitura} | {auth-xxx.setup — existe?} | {e2e/.auth/user-xxx.json} |

### Fixtures / Seeds

- **Fixtures determinísticas**: {marcador `E2E-*`, onde mora, usada por quais cenários}
- **Idempotência do seed**: reaproveita registro por chave única (evita 409 / cascata destrutiva).

### Scopes / projeto de teste

- **Scope OIDC/API**: {ex: `modulo_api` — onde adicionar}
- **Projeto e2e**: {criar pasta/projeto espelhando o existente}

### Sequenciamento

| Item | Provisionar em | Bloqueia |
|---|---|---|
| {persona X / projeto e2e} | {U0 / fundação} | {cenários [E2E] das fatias} |

## Constitution Check (opcional)

- [ ] Principio 1: {verificacao}

## ADR Compliance

| ADR | Impacto neste plan | Regras aplicaveis |
|-----|-------------------|-------------------|
| 0007 | Loop Engineering | Fatos pinados + Módulo de Ref obrigatórios |

## Risks & Mitigations

| Risco | Mitigação |
|---|---|
| {...} | {...} |
