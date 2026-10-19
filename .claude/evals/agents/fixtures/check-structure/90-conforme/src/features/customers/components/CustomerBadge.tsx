import { Badge } from '@/shared/components/Badge';

type CustomerBadgeProps = { name: string };

export function CustomerBadge({ name }: CustomerBadgeProps): JSX.Element {
  return <Badge texto={name} />;
}
