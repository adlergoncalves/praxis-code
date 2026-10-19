import { CustomerBadge } from '../../customers/components/CustomerBadge';
import { useOrders } from '../hooks/useOrders';

export function OrderList(): JSX.Element {
  const orders = useOrders();
  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          <CustomerBadge name={order.customerName} />
        </li>
      ))}
    </ul>
  );
}
