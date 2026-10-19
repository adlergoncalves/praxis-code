type ComentarioProps = {
  autor: string;
  corpo: string;
};

export function Comentario({ autor, corpo }: ComentarioProps): JSX.Element {
  return (
    <article>
      <h3>{autor}</h3>
      <div dangerouslySetInnerHTML={{ __html: corpo }} />
    </article>
  );
}
