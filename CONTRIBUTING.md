# Contribuindo com o Praxis

Obrigado pelo interesse! Este guia resume como propor mudanças no kit.

## Antes de começar

- Para mudanças grandes (nova skill, novo domínio, mudança no pipeline), abra uma **issue** primeiro para discutir a proposta.
- Documentação e conteúdo de skills/agents são escritos em **Português Brasileiro**. Código, nomes de arquivos e mensagens de commit em **Inglês**.

## Preparando o ambiente

Os hooks de aprendizado do kit também rodam quando você edita o próprio kit e gravam no `docs/project/learnings/ledger.md`, que precisa chegar vazio para quem usa o template. Desligue-os localmente:

```bash
echo '{ "disableAllHooks": true }' > .claude/settings.local.json   # já está no .gitignore
```

## Fluxo

1. Faça um fork e crie uma branch a partir de `main` (`feat/...`, `fix/...`, `docs/...`).
2. Faça as mudanças.
3. Rode as checagens locais (Node.js ≥ 18, sem dependências):

   ```bash
   node scripts/generate-index.mjs   # regenera docs/kit-index.{md,json}
   node scripts/validate-kit.mjs     # frontmatter, nomes duplicados, depends, hooks
   ```

4. Adicione uma entrada em `CHANGELOG.md` na seção `[Unreleased]`.
5. Abra um Pull Request para `main`.

## Convenções

### Commits — [Conventional Commits](https://www.conventionalcommits.org/)

```
feat(execute): adiciona guardrail de "sem progresso"
fix(setup): nao remove agent ux em projetos sem frontend
docs(readme): corrige contagem de skills
chore(ci): atualiza actions/checkout
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `chore`, `ci`. Escopo = nome da skill, agent ou área.

### Skills e agents

- **Skill**: `.claude/skills/<nome>/SKILL.md`, com frontmatter `description` (obrigatório) e, quando houver, `depends:` listando os arquivos que ela usa.
- **Agent**: `.claude/agents/<dominio>/<nome>.md`, com frontmatter `name`, `description` e `tools`. O nome precisa ser **único** no kit inteiro — o Claude Code resolve agents pelo nome.
- Escolha o domínio conforme `docs/kit-domains.md`. Critério skill vs. agent em `docs/kit-architecture.md`.
- Não edite `docs/kit-index.*` à mão — são gerados.
- Hooks: o bloco `hooks` de `.claude/settings.json` e o de `.claude/hooks/hooks.manifest.json` precisam ser idênticos.

## Versionamento

O kit segue [SemVer](https://semver.org/lang/pt-BR/) com tags `vX.Y.Z` na `main`:

- **MAJOR** — quebra para quem já usa o kit: skill/agent renomeado ou removido, formato de artefato (manifest, spec, tasks) incompatível, pasta movida.
- **MINOR** — skill, agent, template ou gate novo, compatível.
- **PATCH** — correção de texto, bug em script, ajuste de prompt sem mudança de contrato.

Releases são publicadas no GitHub a partir da tag, com as notas copiadas do `CHANGELOG.md`.
