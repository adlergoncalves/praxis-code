type CartaoProjetoProps = {
  nome: string;
  atualizadoEm: string;
  aoAbrir: () => void;
};

export function CartaoProjeto({ nome, atualizadoEm, aoAbrir }: CartaoProjetoProps): JSX.Element {
  return (
    <div className="cartao" onClick={aoAbrir}>
      <h3>{nome}</h3>
      <p>Atualizado em {atualizadoEm}</p>
    </div>
  );
}
