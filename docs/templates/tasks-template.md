# Tasks: {Titulo da Feature}

**Spec**: [{nome}](../spec.md)
**Plan**: [{nome}](../plan.md)
**Created**: {YYYY-MM-DD}
**Team Scope**: {full|front|back|db}

> **Loop Engineering (ADR-0007).** A **unidade de iteração é a fatia vertical** (U0…Un),
> cada uma = uma User Story (ou fundação declarada). O `/execute` roda **uma fatia por
> iteração** → implementa → verifica → conserta até verde → marca DONE → PARA. Este
> arquivo é o **estado durável** do loop (trava T2: **sem `STATUS.md` concorrente**).

---

## Definição de Pronto (DoD) — vale para TODA fatia

Uma fatia só é `DONE` quando **todos** forem verdadeiros:

1. **Test-first cumprido** (quando há mudança de comportamento em código testado): teste alterado/escrito antes, mostrado falhando (RED), justificado; produção depois (GREEN); refactor sem mexer no teste.
2. **Cenários de aceitação da fatia passam** (`[B]`/`[F]`/`[E2E]` mapeados abaixo).
3. **Gates da(s) camada(s) verdes** (tabela abaixo). **Nunca marcar DONE com gate vermelho.**
4. **Conformidade com ADRs** citados (sem violações) — `/backend-validate` / `/frontend-validate` quando disponíveis.
5. **Defense-in-depth** — toda regra de negócio validada existe no **front (UX)** E no **back (integridade)**.
6. **Sem strings hardcoded** (i18n) e **a11y mínima** (role, teclado, touch targets) — se UI.
7. **Fidelidade** (se UI com régua pixel-perfect na spec): página renderizada == frame (ou conforme DS / segue tela existente — ver spec § Régua de Fidelidade).
8. **Verificação manual (1-3 passos) confere** — a do contrato da fatia.
9. **`tasks.md` atualizado** (fatia DONE + Loop Log).

---

## Gates (rodar conforme as camadas tocadas)

| Camada | Comandos (preencher com o stack real do projeto) |
|---|---|
| Backend | {ex: build · test · format} |
| Database | {ex: migration/deploy} |
| Frontend (unit) | {ex: type-check · lint · test · build} |
| Frontend (e2e/BDD) | {ex: Playwright — quando aplicável} |
| Conformidade | {/backend-validate · /frontend-validate} |

---

## Backlog de Fatias (U0…Un)

> Cada fatia atravessa as camadas necessárias para **um comportamento**, com início,
> meio e fim, **verificável na mão**. Fundação (U0/U1) é exceção declarada do princípio
> vertical, mas ainda entrega algo verificável (dado real / permissão testável).

### U«n» — {título da fatia} {(= User Story X.Y)}

- **Valor entregável:** {o que passa a funcionar e é verificável na mão}
- **Camadas:** `[ ] DB  [ ] Domain  [ ] UseCase  [ ] Endpoint  [ ] FE  [ ] E2E`
- **Depende de:** {U_x | —}
- **Início (pré-estado):** {o que já existe quando esta fatia começa}
- **Critério de PRONTO (file-level):**
  - {mudança concreta 1 — arquivo/símbolo}
  - {mudança concreta 2}
  - Testes RED→GREEN passam (ver mapa BDD); gates verdes.
- **Verificação MANUAL:** 1. {passo}; 2. {passo}; 3. {passo}.
- **Fora de escopo:** {o que NÃO entra nesta fatia}
- **ADRs:** {0007 + ADRs da fatia}. **Ref (`arquivo:linha`):** {exemplar a copiar}
- **Sub-tasks:**
  - [ ] [T001] [P] {sub-task — caminho/do/arquivo}
  - [ ] [T002] {sub-task — caminho/do/arquivo}
- **Cenários de aceitação (BDD):**
  - `[B]` {Dado … Quando … Então …} → teste `Metodo_Cenario_Resultado`
  - `[F]` {…} → teste Vitest/RTL
  - `[E2E]` {…} → teste Playwright (se aplicável)

---

## Grafo de dependências

```
U0 ──┐
U1 ──┼──→ U3 ──→ U4 ──→ U5
U2 ──┘
```

{U0/U1/U2 paralelizáveis entre si; U3+ sequenciais — ajustar à demanda}

---

## Checker da decomposição (rodar na lista — portão pré-execução)

- [ ] Toda fatia é **vertical** (não "uma camada inteira") — fundação é exceção declarada.
- [ ] Toda fatia é **entregável e verificável manualmente** (tem passo de verificação manual).
- [ ] Todo critério de aceite mapeia a **≥1 teste nomeado** (`[B]`/`[F]`/`[E2E]`).
- [ ] Dependências formam **grafo sem ciclo**.
- [ ] Cada fatia cabe em **uma iteração** (se inchar, dividir em `U_n.a` / `U_n.b`).

---

## Estado durável (Loop Log) — fonte única, mantido pelo /execute

| Fatia | Status | Data | Commit/PR | Notas |
|---|---|---|---|---|
| U0 | `TODO` | — | — | — |
| U1 | `TODO` | — | — | — |

**Status possíveis**: `TODO` | `WIP` | `DONE` | `BLOCKED`.
**BLOCKED** = motivo de 1 linha + o que destrava (escala, não improvisa — ADR-0007 T4).

---

## Cobertura (US → fatia)

| User Story | Fatia | Status |
|-----------|-------|--------|
| US-X.Y | U«n» | — |

## Tasks Delegadas (se team scope != full)

- [D001] [team-{outro}] {descrição} — necessário para U«n»
