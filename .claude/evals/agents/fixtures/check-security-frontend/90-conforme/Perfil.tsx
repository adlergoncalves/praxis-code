type PerfilProps = {
  nome: string;
  bio: string;
  site: string;
};

export function Perfil({ nome, bio, site }: PerfilProps): JSX.Element {
  return (
    <section>
      <h2>{nome}</h2>
      <p>{bio}</p>
      <a href={site} target="_blank" rel="noopener noreferrer">
        Site pessoal
      </a>
    </section>
  );
}
