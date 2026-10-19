export type Item = {
  preco: number;
  quantidade: number;
};

export function aplicarDesconto(itens: Item[], percentual: number): number {
  const bruto = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  // @ts-ignore
  return bruto - bruto * percentual.valor;
}
