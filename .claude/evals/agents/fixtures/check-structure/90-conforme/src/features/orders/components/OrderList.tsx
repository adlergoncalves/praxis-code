import { Badge } from '@/shared/components/Badge';
import { useOrders } from '../hooks/useOrders';

export function OrderList(): JSX.Element {
  const orders = useOrders();
  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          <Badge texto={order.customerName} />
        </li>
      ))}
    </ul>
  );
}
