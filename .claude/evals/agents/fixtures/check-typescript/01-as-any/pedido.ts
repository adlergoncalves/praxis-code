export type Pedido = {
  id: string;
  total: number;
};

export function lerPedido(bruto: string): Pedido {
  const dados = JSON.parse(bruto) as any;
  return { id: String(dados.id), total: Number(dados.total) };
}
