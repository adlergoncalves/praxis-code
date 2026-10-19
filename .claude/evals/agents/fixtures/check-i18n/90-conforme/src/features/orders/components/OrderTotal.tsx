import { useTranslation } from '@/shared/i18n/useTranslation';

type OrderTotalProps = { total: number };

export function OrderTotal({ total }: OrderTotalProps): JSX.Element {
  const { t, locale } = useTranslation('orders');
  const valor = new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(total);
  return (
    <p>
      {t('title')}: {valor}
    </p>
  );
}
