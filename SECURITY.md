# Política de Segurança

## Reportando uma vulnerabilidade

Se você encontrar um problema de segurança no kit (por exemplo, um hook ou script que execute comandos de forma insegura, ou uma instrução de agent que induza vazamento de segredos), **não abra uma issue pública**.

Use o **Private vulnerability reporting** do GitHub: aba *Security* → *Report a vulnerability*.

Você receberá uma resposta em até 7 dias.

## Escopo

- Hooks (`.claude/hooks/`) e scripts (`.claude/scripts/`, `scripts/`)
- Permissões padrão em `.claude/settings.json`
- Instruções de skills/agents que afetem segurança do projeto que usa o kit
