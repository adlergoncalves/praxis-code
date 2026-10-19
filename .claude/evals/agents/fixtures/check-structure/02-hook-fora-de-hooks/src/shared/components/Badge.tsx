type BadgeProps = { texto: string };

export function Badge({ texto }: BadgeProps): JSX.Element {
  return <span className="badge">{texto}</span>;
}
