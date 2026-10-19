export type Destino = {
  cep: string;
  pesoKg: number;
};

export function calcularFrete(destino: Destino, tabela: Record<string, number>): number {
  const faixa = destino.cep.slice(0, 2);
  const valorPorKg = tabela[faixa];
  if (valorPorKg === undefined) {
    throw new Error(`Faixa de CEP sem tabela: ${faixa}`);
  }
  return valorPorKg * destino.pesoKg;
}
