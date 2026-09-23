# Changelog

Todas as mudanças relevantes do kit são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.1.0] — primeira versão pública

### Adicionado
- 39 skills e 45 agents organizados em 8 domínios (`orchestration`, `discovery`, `product`, `architecture`, `delivery`, `quality`, `frontend`, `backend`).
- Agente master Praxis (`/praxis`, `/mode praxis on|off`).
- Loop Engineering (ADR-0007): execução por fatia vertical com gates objetivos e `/verify-all`.
- ADR-0008 (Segurança e LGPD) e 13 templates de ADR.
- Hooks de aprendizado (`.claude/hooks/`) registrados em `.claude/settings.json`.
- `scripts/generate-index.mjs` e `scripts/validate-kit.mjs`, executados no CI.

### Alterado
- Distribuição como template de repositório (clone / *Use this template*).
