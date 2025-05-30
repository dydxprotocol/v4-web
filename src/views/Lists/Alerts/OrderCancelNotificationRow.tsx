import { LocalCancelOrderData } from '@/constants/trade';

export const OrderCancelNotificationRow = ({
  className,
  timestamp,
  localCancelOrder,
}: {
  className?: string;
  timestamp: number;
  localCancelOrder: LocalCancelOrderData;
}) => {
  return <div>OrderCancelNotification</div>;
};
