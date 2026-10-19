import { useTranslation } from '@/shared/i18n/useTranslation';

type OrderTotalProps = { total: number };

export function OrderTotal({ total }: OrderTotalProps): JSX.Element {
  const { t } = useTranslation('orders');
  return (
    <p>
      {t('title')}: R$ {total.toFixed(2)}
    </p>
  );
}
