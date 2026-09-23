---
description: "Gera prototipos hi-fi no Paper (MCP) a partir de PRD ou descricao de tela, usando o Design System real do projeto."
user-invocable: true
depends:
  - .claude/agents/frontend/paper-prototype.md
---

# /prototype

Gera prototipos hi-fi diretamente no canvas do Paper usando as Paper MCP tools, seguindo fielmente o Design System e a estrutura real do projeto.

**NAO amarrada ao pipeline** — o usuario chama quando precisa, sem ser obrigatorio.

## Input

`/prototype {prd-path-ou-descricao}`

- Se `$ARGUMENTS` apontar para um arquivo `.md` → le como PRD/spec
- Se for texto livre → usa como descricao direta da tela
- Se vazio → pergunta ao usuario

## Pre-requisitos

1. **Paper MCP** deve estar configurado
2. `docs/project/discovery.md` deve existir (para contexto do projeto)
3. DS inicializado e recomendado mas nao obrigatorio (se nao existe, usa tokens padrao)

## Verificacao de MCP (OBRIGATORIO)

Antes de delegar ao agent, verificar se o Paper MCP esta disponivel:

1. Tentar chamar `get_basic_info` do Paper MCP
2. **Se funcionar** → prosseguir normalmente
3. **Se falhar** → informar ao usuario e NAO prosseguir:

```
O Paper MCP nao esta configurado. Para usar /prototype:

1. Instale o Paper MCP seguindo a documentacao oficial
2. Adicione a configuracao ao seu settings.json ou mcp.json
3. Reinicie o Claude Code

Apos configurar, rode /prototype novamente.
```

## Execucao

Delegar ao agent `@paper-prototype` que:

1. **Carrega contexto do projeto**: tokens do DS (globals.css), ADRs, componentes existentes, layout do app
2. **Interpreta input**: tipo de tela, campos, secoes, hierarquia
3. **Pergunta o link do projeto Paper** ao usuario
4. **Constroi no Paper**: App Shell → Conteudo → Review → Finalizar
5. **Apresenta resultado**: screenshot + resumo das secoes construidas

## Gestao de Contexto

O agent le muitos arquivos do projeto. Recomende `/clear` apos gerar o prototipo.

## Handoffs

- → `/clear` (limpar contexto)
- → `/implement --team front` (implementar o que foi prototipado)
- → `/ds-component` (se precisar adicionar componente ao DS antes)
