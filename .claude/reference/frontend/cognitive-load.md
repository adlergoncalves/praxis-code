# Cognitive Load — 8 Leis de UX (reference canônico, agnóstico)

> Leis de design de interface comprovadas. Vocabulário estável do kit Praxis.
> **Lido por**: `@ux` (todos os modos), `@design` (critique, polish), `@check-ux`, `@paper-prototype`.

---

## Princípio

UX bom respeita os limites cognitivos do usuário. Estas 8 leis não são opinião — são restrições humanas. Toda interface que ignora uma delas paga o preço em atrito, abandono ou erro.

Use como **vocabulário** ao avaliar e propor: citar a lei explicita a razão da escolha ("estou agrupando porque Miller's Law", "estou priorizando alvo grande porque Fitts's Law em mobile").

---

## As 8 leis

| Lei | Definição | Aplicação prática |
|---|---|---|
| **Fitts's Law** | Tempo de clicar em um alvo cresce com a distância e diminui com o tamanho do alvo | Botões primários grandes; alvos pequenos perto da borda da tela (o dock do Mac é infinitamente grande); CTA principal grande e próximo do conteúdo relevante |
| **Hick's Law** | Tempo de decisão cresce com o número de opções | Limitar opções por tela; agrupar visualmente; menus longos preferem busca a lista; mostrar 5-7 e expandir sob demanda |
| **Miller's Law** | Memória de curto prazo cabe 7 ± 2 itens | Agrupar conteúdo em chunks de 5-9; cards/listas em blocos visuais separados; nunca 30 campos em uma tela |
| **Tesler's Law** (Lei da Complexidade Conservada) | Complexidade não desaparece, só é transferida | Decidir conscientemente: o sistema simplifica para o usuário, ou empurra a complexidade para ele? Defaults inteligentes > 20 perguntas no onboarding |
| **Jakob's Law** | Usuários esperam que seu produto funcione como os outros que conhecem | Convenções ganham: logo no canto superior esquerdo, busca no topo, carrinho no canto superior direito, Cmd+K para command palette |
| **Doherty Threshold** | Resposta do sistema em <400ms = usuário sente fluxo (zero atrito) | Optimistic UI (mostrar resultado antes da resposta do server); skeleton em vez de spinner; debounce em busca tipo-em-tempo-real |
| **Postel's Law** (Robustness Principle) | Ser conservador no que produz, liberal no que aceita | Inputs de telefone/CPF/data devem aceitar variações de formato e normalizar; mensagens de erro padronizadas |
| **Aesthetic-Usability Effect** | UI bonita é percebida como mais usável, mesmo com bugs iguais a UI feia | Polish importa — espaço em branco, tipografia cuidadosa e motion sutil melhoram a percepção de qualidade tanto quanto features novas |

---

## Como usar este reference

Ao propor ou criticar interface, identifique **qual lei ancora a decisão**:

- "Esse formulário tem 23 campos sem agrupamento — fere Miller's Law. Sugiro chunks de 5-7 por seção."
- "O botão de salvar está pequeno no rodapé do mobile — fere Fitts's Law. Subir para sticky bottom, área 44x44px mínimo."
- "A busca demora 1.2s sem feedback — fere Doherty Threshold. Adicionar skeleton + debounce."

Citar a lei explicita a razão. **Razão explícita > opinião do designer.**
