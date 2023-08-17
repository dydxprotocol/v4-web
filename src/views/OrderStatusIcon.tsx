import { type OrderStatus, AbacusOrderStatus } from '@/constants/abacus';

import { Icon } from '@/components/Icon';
import {
  OrderCanceledIcon,
  OrderFilledIcon,
  OrderOpenIcon,
  OrderPartiallyFilledIcon,
  OrderPendingIcon,
} from '@/icons';

import styled from 'styled-components';

type ElementProps = {
  status: OrderStatus;
  totalFilled: number;
};

export const OrderStatusIcon = ({ status, totalFilled }: ElementProps) => (
  <$Icon
    {...{
      [AbacusOrderStatus.open.name]:
        totalFilled > 0
          ? {
              iconComponent: OrderPartiallyFilledIcon,
              color: 'var(--color-warning)',
            }
          : {
              iconComponent: OrderOpenIcon,
              color: 'var(--color-text-2)',
            },
      [AbacusOrderStatus.filled.name]: {
        iconComponent: OrderFilledIcon,
        color: 'var(--color-success)',
      },
      [AbacusOrderStatus.cancelled.name]: {
        iconComponent: OrderCanceledIcon,
        color: 'var(--color-error)',
      },
      [AbacusOrderStatus.canceling.name]: {
        iconComponent: OrderPendingIcon,
        color: 'var(--color-error)',
      },
      [AbacusOrderStatus.pending.name]: {
        iconComponent: OrderPendingIcon,
        color: 'var(--color-text-2)',
      },
      [AbacusOrderStatus.untriggered.name]: {
        iconComponent: OrderPendingIcon,
        color: 'var(--color-text-2)',
      },
    }[status.name]}
  />
);

const $Icon = styled(Icon)<{ color: string }>`
  color: ${({ color }) => color};
`;
