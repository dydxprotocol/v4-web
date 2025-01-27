import { OrderStatus } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { Icon } from '@/components/Icon';

import { getOrderStatusInfo, getOrderStatusInfoNew } from '@/lib/orders';

type ElementProps = {
  status: string;
};

type StyleProps = {
  className?: string;
};

export const OrderStatusIcon = ({ className, status }: ElementProps & StyleProps) => {
  const { statusIcon, statusIconColor } = getOrderStatusInfo({ status });
  return <$Icon className={className} iconName={statusIcon} color={statusIconColor} />;
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
