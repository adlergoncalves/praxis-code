# ADR-NNNN: Forms Stack

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Formularios sao a parte mais complexa de aplicacoes frontend. Sem uma stack definida, cada desenvolvedor escolhe sua abordagem: `useState` por campo, libraries diferentes, validacao manual, mascaras via onChange. O resultado e codigo inconsistente, dificil de manter e com UX imprevisivel.

Uma stack padronizada para formularios garante consistencia, reduz boilerplate e centraliza validacao.

## Decisao
Adotar uma stack integrada para formularios:

### Camadas
| Camada | Responsabilidade | Exemplo |
|--------|-----------------|---------|
| Form library | Gerenciamento de estado, submit, reset, dirty tracking | react-hook-form, Formik |
| Schema validation | Definicao de regras de validacao como schema declarativo | Zod, Yup, Valibot |
| Resolver | Ponte entre form library e schema validation | @hookform/resolvers |
| Input masks | Formatacao visual de campos (CPF, telefone, CEP) | react-imask, react-number-format |

### Configuracao padrao
```tsx
const form = useForm({
  mode: 'onBlur',              // Validacao no blur (ver ADR de validacao)
  resolver: zodResolver(schema), // Schema como unica fonte de verdade
});
```

### Validators centralizados
Validators reutilizaveis em `shared/lib/validators.ts`:
```typescript
// shared/lib/validators.ts
export const cpfSchema = z.string().refine(isValidCpf, 'CPF invalido');
export const emailSchema = z.string().email('Email invalido');
export const cepSchema = z.string().length(8, 'CEP deve ter 8 digitos');
export const phoneSchema = z.string().refine(isValidPhone, 'Telefone invalido');
```

### Erro 422 do servidor
Erros de validacao retornados pelo backend (HTTP 422) devem ser mapeados para `setError()` por campo:
```tsx
try {
  await submitForm(data);
} catch (error) {
  if (error.status === 422 && error.details) {
    Object.entries(error.details).forEach(([field, messages]) => {
      form.setError(field, { message: messages[0] });
    });
  }
}
```

### Mascaras de input
Mascaras devem ser aplicadas via library dedicada (react-imask ou equivalente), nunca via manipulacao manual de onChange:
```tsx
// Correto: mask library
<Controller
  control={form.control}
  name="cpf"
  render={({ field }) => (
    <IMaskInput mask="000.000.000-00" {...field} />
  )}
/>

// Incorreto: mascara manual
onChange={(e) => setCpf(formatCpf(e.target.value))}
```

## Alternativas Consideradas
1. **useState por campo:** Zero dependencias, mas boilerplate massivo, sem dirty tracking, sem validacao integrada.
2. **Formik:** Madura e popular, mas API mais verbosa que react-hook-form e re-renders mais frequentes.
3. **Validacao inline (sem schema):** Validacao dentro do componente. Funciona, mas duplica regras e dificulta testes.
4. **Mascaras via onChange manual:** Controle total, mas reimplementa logica ja resolvida por libraries e introduz bugs sutis.

## Consequencias
### Positivas
- Consistencia: todos os formularios usam a mesma stack
- Schema como fonte unica de verdade para validacao
- Validators centralizados evitam duplicacao de regras
- Erros 422 mapeados automaticamente para campos do formulario
- Mascaras robustas via library especializada

### Negativas
- Curva de aprendizado inicial para a stack completa
- Dependencia de multiplas libraries (form + schema + resolver + mask)
- Schema de validacao pode ficar complexo para formularios grandes

## Regras para Validacao
- PROIBIDO: `useState` individual por campo de formulario
- PROIBIDO: Validacao `onChange` como modo padrao (deve ser `onBlur`)
- PROIBIDO: Mascaras implementadas manualmente via onChange
- OBRIGATORIO: Form library + schema validation integrados
- OBRIGATORIO: `mode: 'onBlur'` como modo padrao de validacao
- OBRIGATORIO: Validators reutilizaveis centralizados em `shared/lib/validators.ts`
- OBRIGATORIO: Erros HTTP 422 mapeados para `setError()` por campo
- PREFERIDO: Schema declarativo (Zod, Yup) como unica fonte de verdade para validacao
