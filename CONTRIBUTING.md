# Contribuindo com o Praxis

Obrigado pelo interesse! Este guia resume como propor mudanças no kit.

## Antes de começar

- Para mudanças grandes (nova skill, novo domínio, mudança no pipeline), abra uma **issue** primeiro para discutir a proposta.
- Documentação e conteúdo de skills/agents são escritos em **Português Brasileiro**. Código, nomes de arquivos e mensagens de commit em **Inglês**.

## Preparando o ambiente

O `docs/project/learnings/ledger.md` precisa chegar vazio para quem usa o template: ao editar o kit, não registre linhas `(llm)` nele (as linhas automáticas dos hooks vão para `ledger-auto.md`, gitignored). Para não ter os hooks rodando enquanto edita o kit, desligue-os localmente:

```bash
echo '{ "disableAllHooks": true }' > .claude/settings.local.json   # já está no .gitignore
```

## Fluxo

1. Faça um fork e crie uma branch a partir de `main` (`feat/...`, `fix/...`, `docs/...`).
2. Faça as mudanças.
3. Rode as checagens locais (Node.js ≥ 18, sem dependências):

   ```bash
   node scripts/generate-index.mjs   # regenera docs/kit-index.{md,json} e catalog.json
   node scripts/build-seed.mjs       # regenera seed/ (a semente que os projetos instalam)
   node scripts/validate-kit.mjs     # frontmatter, nomes, depends, hooks (aprendizado e qualidade), JSON, evals, caminhos pessoais
   ```

4. Adicione uma entrada em `CHANGELOG.md` na seção `[Unreleased]`.

### Versão do catálogo (ADR-0009)

Os projetos puxam ferramentas da **tag** `v<VERSION>`. Para publicar: atualizar `VERSION` (SemVer — formato lido por script, como `tasks.md`, `doctor.json` ou o lock, só muda em **major**), rodar `generate-index` e `build-seed`, commitar e criar a tag `vX.Y.Z` no mesmo commit. A semente em `main` sempre aponta para uma tag existente.

Para testar uma branch antes da tag, num projeto de teste: `"ref": "<branch>"` e `"repo": "file:///caminho/do/clone"` no `.claude/praxis.json`, e `PRAXIS_CACHE_DIR` apontando para uma pasta temporária.
5. Abra um Pull Request para `main`.

## Convenções

### Commits — [Conventional Commits](https://www.conventionalcommits.org/)

```
feat(execute): add "no progress" guardrail
fix(setup): keep the ux agent in projects without frontend
docs(readme): fix skill count
chore(ci): bump actions/checkout
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
