import { useTranslation } from '@/shared/i18n/useTranslation';

type OrdersHeaderProps = { aoCriar: () => void };

export function OrdersHeader({ aoCriar }: OrdersHeaderProps): JSX.Element {
  const { t } = useTranslation('orders');
  return (
    <header>
      <h1>Pedidos em aberto</h1>
      <button type="button" onClick={aoCriar}>
        {t('create')}
      </button>
    </header>
  );
}
