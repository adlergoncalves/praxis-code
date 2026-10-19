type BuscaClientesProps = {
  termo: string;
  aoMudarTermo: (termo: string) => void;
  aoBuscar: () => void;
};

export function BuscaClientes({ termo, aoMudarTermo, aoBuscar }: BuscaClientesProps): JSX.Element {
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        aoBuscar();
      }}
    >
      <label htmlFor="busca-clientes">Buscar clientes</label>
      <input
        id="busca-clientes"
        name="busca"
        type="search"
        autoComplete="off"
        value={termo}
        onChange={(evento) => aoMudarTermo(evento.target.value)}
      />
      <button type="submit">Buscar</button>
    </form>
  );
}
