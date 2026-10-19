# Tasks: {Titulo da Feature}

**Spec**: [{nome}](../spec.md)
**Plan**: [{nome}](../plan.md)
**Created**: {YYYY-MM-DD}
**Team Scope**: {full|front|back|db}

> **Loop Engineering (ADR-0007).** A **unidade de iteração é a fatia vertical** (U0…Un),
> cada uma = uma User Story (ou fundação declarada). O `/execute` roda **uma fatia por
> iteração**, na sessão principal → implementa → verifica → conserta até verde → marca DONE → segue para a próxima fatia liberada (só para no realmente bloqueante; `--checkpoint` é opt-in). Este
> arquivo é o **estado durável** do loop (trava T1: **sem `STATUS.md` concorrente**).

---

## Preflight de execução — respondido pelo usuário no portão final do `/tasks`

> Perguntado junto da aprovação do pacote (opções + implicação), nunca presumido e nunca
> no meio da corrida. São decisões de *execução*: variam por demanda e não pertencem à
> spec. Com o pacote aprovado, o `/execute` roda **autônomo**: encadeia as fatias,
> commita conforme abaixo e só para no realmente bloqueante. O `loop-driver.mjs` não
> roda com linha `—`.

| Definição | Resposta |
|---|---|
| **Branch** | — |
| **Política de commit** | — |
| **Push** | — |
| **Modo de execução** | — |
| **Scan de segurança** | — |
| **Pacote aprovado em** | — |

- **Branch**: `feature/«nome»`, criada de `«base»`. Nunca a branch principal.
- **Política de commit**: `commit autônomo` (default — `test(...)` → `feat|fix(...)` por fatia, sem pedir ok) ou `staged` (staged + mensagem proposta; fecha `DONE (staged)`).
- **Push**: `sim` (push da branch da feature ao fechar cada fatia) ou `não` (só commits locais).
- **Modo de execução**: `sequencial` (default) ou `multi-agente nos grupos G«n»` — só grupos com pontos de colisão declarados no grafo.
- **Scan de segurança**: `sim, esforço high` (default quando o plugin Claude Security está instalado — roda no fechamento sobre o diff da branch, custo aceito aqui) · `sim, esforço medium` · `não`.
- **Pacote aprovado em**: data do de-acordo do usuário no portão final. Vazio = o `/execute` não começa.

---

## Prontidão para execução autônoma — preenchida no portão final do `/tasks`

> Fonte das métricas que o guia de validação mostra. O índice é a **previsão** de quanto
> o loop segue sozinho **depois** de eliminadas as paradas evitáveis — mexer no número
> sem remover a causa é maquiagem.

### Paradas prováveis — levantadas e eliminadas antes do loop

| Parada provável | Evidência (onde/por quê) | Como some | Quem resolve | Situação |
|---|---|---|---|---|
| {ex.: fatia U3 precisa de credencial de sandbox} | {plan › Infra} | {credencial no `.env` local antes do loop} | {usuário} | {resolvida / aceita como risco} |

O que é do agente entra no pacote sem perguntar; o que depende do usuário vira pergunta
no portão. O que sobrar como risco aceito aparece no guia como "top riscos de parada".

### Cobertura de entendimento: «NN»%

| Componente | Contagem | Fonte | O que falta (se < 100%) |
|---|---|---|---|
| Decisões de negócio fechadas | «n/n» | spec › Decisões Fechadas | — |
| Fatos do codebase pinados (`arquivo:linha`) | «n/n» | plan › Fatos Confirmados | — |
| Regras de negócio com ≥1 cenário BDD nomeado | «n/n» | spec × fatias | — |
| Telas com fonte de design declarada (protótipo ou DS) | «n/n» | spec › Anatomia da Tela | — |
| Infra de verificação provisionada | «n/n» | plan › Infra de Verificação | — |

Média simples dos componentes aplicáveis (componente que não se aplica sai da conta).

### Índice de execução autônoma: «NN»%

| Fator de risco que sobrou | Quantos | Desconto | Fatia |
|---|---|---|---|
| Decisão diferida **sem** default + critério | «n» | −15 cada | — |
| Dependência de serviço externo vivo (credencial, ambiente, ferramenta) | «n» | −10 cada | — |
| Infra que só nasce durante o loop | «n» | −5 cada | — |
| Cadeia de dependência > 3 fatias sem paralelismo | «sim/não» | −5 | — |
| Tela nova sem fonte de design (julgamento subjetivo) | «n» | −5 cada | — |

Parte de 100% e desconta só o que **sobrou** depois da tabela de paradas. Pesos são
ponto de partida — calibrar com o realizado.

### Calibração (preenchida pelo `/execute` ao fim)

- **Previsto**: «NN»% · **Realizado**: «iterações sem intervenção humana / total» · **Causa dominante do desvio**: «…»

---

## Definição de Pronto (DoD) — vale para TODA fatia

Uma fatia só é `DONE` quando **todos** forem verdadeiros:

1. **Test-first cumprido** (quando há mudança de comportamento em código testado): teste alterado/escrito antes, mostrado falhando (RED), **classificado** (`contrato-novo` · `especificacao-nova` · `refactor-puro` · `teste-de-implementacao` — nunca `ajuste-para-passar`) e justificado com a fonte; produção depois (GREEN); refactor sem mexer no teste. Teste de regra de negócio que nasceu verde: mutantes mortos (`.claude/scripts/mutants.mjs`).
2. **Cenários de aceitação da fatia passam** (`[B]`/`[F]`/`[E2E]` mapeados abaixo).
3. **Gates da(s) camada(s) verdes** (tabela abaixo). **Nunca marcar DONE com gate vermelho.**
4. **Conformidade com ADRs** citados (sem violações) — conferida por **verificador independente** (check agents despachados pelo `/execute` sobre os arquivos da fatia), não por quem implementou.
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

**Grupos paralelizáveis** (só usados se o Preflight liberar multi-agente):

| Grupo | Fatias | Pontos de colisão (arquivos/símbolos que mais de uma fatia toca) | Ordem de integração |
|---|---|---|---|
| G1 | U0, U1, U2 | {ex.: registro de rotas, arquivo de i18n} | U0 → U1 → U2 |

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

**Status possíveis**: `TODO` | `WIP` | `DONE` | `BLOCKED` | `ABANDONADA`.
**BLOCKED** = motivo de 1 linha + o que destrava (escala, não improvisa — ADR-0007 T3).
**ABANDONADA** = decisão do usuário no watchdog anti-giro, com o motivo nas Notas.
Não mudar a ordem das colunas: o `loop-driver.mjs` lê `| Fatia | Status |`.

### Log de iterações — uma linha por iteração, concluída ou não

| Data | Fatia | Resultado | Gates | Commits | Custo aprox. |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

**Resultado**: `DONE` | `BLOCKED` | `PARCIAL` | `SEM PROGRESSO`. É o que alimenta o
watchdog: na 3ª tentativa da mesma fatia sem progresso, o `/execute` para e devolve a
decisão ao usuário (abandonar · BLOCKED · tentar mais N vezes).

---

## Cobertura (US → fatia)

| User Story | Fatia | Status |
|-----------|-------|--------|
| US-X.Y | U«n» | — |

## Tasks Delegadas (se team scope != full)

- [D001] [team-{outro}] {descrição} — necessário para U«n»
