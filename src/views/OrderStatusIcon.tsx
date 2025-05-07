import { OrderStatus } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { Icon } from '@/components/Icon';

import { getOrderStatusInfoNew } from '@/lib/orders';

type StyleProps = {
  className?: string;
};

type ElementPropsNew = {
  status: OrderStatus;
};
export const OrderStatusIconNew = ({ className, status }: ElementPropsNew & StyleProps) => {
  const { statusIcon, statusIconColor } = getOrderStatusInfoNew({ status });
  return <$Icon className={className} iconName={statusIcon} color={statusIconColor} />;
};

const $Icon = styled(Icon)<{ color: string }>`
  color: ${({ color }) => color};
`;
