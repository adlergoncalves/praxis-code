export type Credenciais = {
  email: string;
  senha: string;
};

export async function entrar(credenciais: Credenciais): Promise<void> {
  const resposta = await fetch('/api/sessao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credenciais),
    credentials: 'include',
  });
  const { accessToken } = (await resposta.json()) as { accessToken: string };
  localStorage.setItem('accessToken', accessToken);
}
