---
name: check-forms
description: Valida patterns de formularios — validacao, masks, UX, acessibilidade de form. Detecta useState por campo, onChange prematuro, falta de schema validation e double submit.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Gerenciamento de Estado de Formulario
- Proibido: `useState` por campo de formulario (ex: `const [name, setName] = useState('')`) — usar form library
- Form library obrigatoria (React Hook Form, Formik ou equivalente)
- Formularios complexos (5+ campos) devem usar schema de validacao externo (Zod, Yup, Joi)

### Validacao
- Validacao deve ser `onBlur` para o primeiro erro (nao `onChange` antes do blur — frustrante para o usuario)
- Apos o primeiro erro visivel, pode validar `onChange` para feedback imediato
- Mensagens de erro devem ser descritivas (nao apenas "Campo invalido") — dizer o que e esperado
- Proibido: validacao apenas no submit sem feedback inline por campo

### Masks e Formatacao
- Proibido: mask manual implementada em `onChange` (ex: formatar CPF caractere por caractere no handler)
- Usar biblioteca de mask (IMask, react-input-mask ou equivalente) ou formatacao no onBlur/submit
- Formatacao visual (ex: CPF com pontos) deve ser separada do valor de dados (sem pontos)

### UX de Formulario
- Proibido: `window.confirm()` para confirmacoes — usar Dialog/Modal
- Botao de submit desabilitado e com indicador durante submissao (prevenir double submit)
- Campos obrigatorios devem ser indicados visualmente (asterisco, label, aria-required)
- Autofocus no primeiro campo de formularios simples (login, busca)
- Inputs de senha devem ter opcao de mostrar/ocultar

### Acessibilidade de Formulario
- Todo `<input>`, `<select>`, `<textarea>` deve ter `<label>` associado (htmlFor ou wrapping)
- Mensagens de erro devem estar associadas ao input (`aria-describedby`)
- `aria-invalid="true"` em inputs com erro

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre forms, validacao, schema. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar patterns de form ja definidos no projeto.

## EXECUCAO

### 1. Verificar useState por campo
- Glob arquivos com formularios (.tsx com `<form` ou `onSubmit`)
- Grep multiplos `useState<string>|useState('')|useState(0)` no mesmo componente de form → ERRO

### 2. Verificar presenca de form library
- Grep `useForm|useFormik|register,|control,` nos arquivos de form
- Formulario sem form library → AVISO

### 3. Verificar schema validation
- Grep `zodResolver|yupResolver|joiResolver|z\.object` em formularios com 5+ campos
- Formulario complexo sem schema → AVISO

### 4. Verificar onChange-only validation (sem onBlur)
- Grep `onChange.*validate|validate.*onChange` sem `onBlur` correspondente → AVISO

### 5. Verificar window.confirm
- Grep `window\.confirm\(` → ERRO

### 6. Verificar mask manual
- Grep `onChange.*replace|onChange.*substring|onChange.*slice` para formatacao → AVISO

### 7. Verificar double submit
- Glob botoes de submit em formularios
- Verificar `disabled={isSubmitting}` ou `loading={isSubmitting}` → AVISO se ausente

### 8. Verificar labels em inputs
- Grep `<input` sem `<label` ou `aria-label` ou `aria-labelledby` proximos → AVISO

### 9. Verificar mensagens de erro associadas
- Grep campos com erro sem `aria-describedby` apontando para a mensagem → AVISO

## CLASSIFICACAO
- **ERRO**: useState por campo em formulario, window.confirm()
- **AVISO**: Formulario sem form library, schema ausente em form complexo, mask manual, double submit possivel, input sem label, onChange-only validation

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao

### Form Library Padronizada
[Se detectado: multiplas libs de form ou formularios sem lib]
- **Situacao**: X formularios usando abordagens diferentes (useState manual, Formik, RHF misturados)
- **Sugestao**: Criar ADR de Form Strategy padronizando uma unica lib para o projeto
- **Como**: `/architect` → criar ADR de Forms Stack
- **Beneficio**: Consistencia, menos bundle size, experiencia de dev unificada

### Schema Validation Centralizado
[Se detectado: validacoes duplicadas entre frontend e backend ou sem schema formal]
- **Situacao**: Regras de validacao definidas em frontend e re-definidas em backend sem fonte unica
- **Sugestao**: Avaliar schema compartilhado (Zod no frontend + inferencia no backend) ou contrato formal
- **Como**: `/architect` → criar ADR de Validation Strategy
- **Beneficio**: Regras de validacao em um unico lugar, menos divergencia frontend/backend
```

Emitir apenas as secoes com evidencia no codigo.
