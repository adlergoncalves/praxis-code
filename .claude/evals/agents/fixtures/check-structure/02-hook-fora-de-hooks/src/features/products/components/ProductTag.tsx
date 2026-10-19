import { Badge } from '@/shared/components/Badge';

type ProductTagProps = { name: string };

export function ProductTag({ name }: ProductTagProps): JSX.Element {
  return <Badge texto={name} />;
}
