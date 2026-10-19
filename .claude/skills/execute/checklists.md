# Checklists de execucao do /execute

> Carregado pelo `/execute` so quando aplicavel: o Checklist 1 em fatia que toca a camada de banco de uma
> stack BaaS; o Checklist 2 uma vez, antes de declarar a feature concluida. Sao verificacoes mecanicas,
> nao opinativas. Item falho → corrigir dentro da fatia; sem correcao possivel → fatia `BLOCKED` (motivo + o que destrava) e o loop segue; a fatia (ou a feature) nao
> fecha sem resolucao ou justificativa explicita.

## Checklist 1 — Seguranca BaaS (apos cada fatia que toca a camada de banco)

**Quando rodar**: ao final de **cada fatia cujo checklist de Camadas tem DB/Banco marcado**, se a stack inclui BaaS (Supabase, Firebase, Amplify, etc.). Detectar lendo `discovery.md`, ADRs e `package.json`. (No modelo de loop por fatia nao existe "fase de banco" isolada — banco e uma camada DENTRO da fatia.)

**Checklist parametrizavel por stack**:

### Supabase / PostgreSQL com RLS

| # | Verificacao | Como |
|---|---|---|
| 1 | Todas as tabelas criadas/alteradas nesta fatia tem **RLS habilitado** | Grep migrations recentes: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Se nao encontrar para tabela criada, falhar |
| 2 | Toda policy de **UPDATE** tem clausula `WITH CHECK` completa | Grep `CREATE POLICY .* FOR UPDATE` em migrations. Se nao tem `WITH CHECK`, falhar |
| 3 | Funcoes serverless desta fatia tem **CORS configurado** | Verificar arquivo `supabase/functions/*/index.ts` por header `Access-Control-Allow-Origin` |
| 4 | Path de claims JWT esta em `app_metadata` (nao `user_metadata` top-level) | Grep policies por `auth.jwt() -> 'user_metadata'` (proibido para autorizacao) vs `auth.jwt() -> 'app_metadata'` (correto) |
| 5 | Service role nunca exposto no client | Grep client code por `SUPABASE_SERVICE_ROLE_KEY` ou `service_role` — deve ser zero |

### Firebase / Firestore

| # | Verificacao | Como |
|---|---|---|
| 1 | Regras de seguranca (`firestore.rules`) **NAO sao permissivas** por default | Grep `allow read, write: if true` ou `if request.auth != null` sem condicoes adicionais — falhar |
| 2 | Cada colecao nova tem regras explicitas | Verificar se colecoes mencionadas no plan tem regras correspondentes em `firestore.rules` |
| 3 | Cloud Functions com `region` definida (nao default us-central1 implicito) | Grep `functions.region(...)` ou `onRequest({region: ...})` |
| 4 | Custom claims definidas via Admin SDK, nao via client | Grep `setCustomUserClaims` apenas em codigo server-side (functions/) |
| 5 | API keys publicas sao mesmo so client-side | Confirmar que keys com prefixo `AIza` so aparecem em codigo client e firestore.rules cobrem o acesso |

### Amplify / Appwrite / outros

Aplicar o **padrao analogo** do BaaS detectado. Se a stack nao esta nesta lista, os pontos de seguranca criticos sao levantados no portao final do `/tasks` (Paradas provaveis) — nunca perguntados no meio da corrida.

**Acao em caso de falha**: pausar, listar item falhado, sugerir correcao. Nao marcar a fatia como DONE (nem avancar para a proxima fatia que toca banco) ate todos os itens passarem ou serem justificados explicitamente.

## Checklist 2 — Pre-finalizacao (antes de marcar /execute como concluido)

Roda **uma vez**, antes de declarar a execucao completa. Verifica problemas sistemicos que passariam batidos em desenvolvimento mas quebrariam em producao.

### Casing de imports (Linux deploy)

**Quando aplicar**: projeto tem deploy em ambiente Linux (Vercel, Railway, Render, Fly.io, AWS, Docker Linux). Detectar via:
- `vercel.json`, `railway.toml`, `render.yaml`, `Dockerfile` na raiz
- ADR mencionando deploy em Linux
- Se ambiguo: tratar como deploy em Linux (o caso mais restritivo) e registrar no relatorio

**Por que importa**: macOS e Windows tem filesystems case-insensitive — `import './Header'` casa com arquivo `header.tsx`. Em Linux (case-sensitive), o mesmo import quebra o build. TypeScript nao detecta. E erro silencioso que so aparece em CI/CD ou producao.

**Como verificar**:

```bash
# Para cada import relativo (ex: "./Components/Header"), verificar se o caminho
# real do arquivo no filesystem tem o mesmo casing exato.
#
# Algoritmo simplificado:
# 1. Listar todos os imports relativos: grep -rEn "from ['\"](\./|\.\./)" --include="*.ts" --include="*.tsx"
# 2. Para cada import, resolver o caminho absoluto
# 3. Comparar caracter a caracter com o caminho real (ls do diretorio)
# 4. Se houver divergencia de case, falhar
```

**Falhas comuns**:
- `import './Header'` mas arquivo e `header.tsx` (lowercase)
- `import '../utils/Date'` mas pasta e `Utils` (capitalized)
- `import { Button } from './components/Button'` mas pasta e `Components`

**Acao em caso de falha**: listar cada import problematico com path real correspondente e oferecer correcao automatica via `Edit` tool.

### Outros checks pre-finalizacao

Adicionar conforme novos padroes recorrentes forem identificados via `process-learnings.md`. O checklist evolui com o projeto.
