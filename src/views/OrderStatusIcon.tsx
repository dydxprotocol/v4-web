import styled from 'styled-components';

import { AbacusOrderStatus } from '@/constants/abacus';

import {
  OrderCanceledIcon,
  OrderFilledIcon,
  OrderOpenIcon,
  OrderPartiallyFilledIcon,
  OrderPendingIcon,
} from '@/icons';

import { Icon } from '@/components/Icon';

type ElementProps = {
  status: string;
  totalFilled: number;
};

type StyleProps = {
  className?: string;
};

export const OrderStatusIcon = ({ className, status, totalFilled }: ElementProps & StyleProps) => {
  const { iconComponent, color } = {
    [AbacusOrderStatus.open.rawValue]:
      totalFilled > 0
        ? {
            iconComponent: OrderPartiallyFilledIcon,
            color: 'var(--color-warning)',
          }
        : {
            iconComponent: OrderOpenIcon,
            color: 'var(--color-text-2)',
          },
    [AbacusOrderStatus.partiallyFilled.rawValue]: {
      iconComponent: OrderPartiallyFilledIcon,
      color: 'var(--color-warning)',
    },
    [AbacusOrderStatus.filled.rawValue]: {
      iconComponent: OrderFilledIcon,
      color: 'var(--color-success)',
    },
    [AbacusOrderStatus.cancelled.rawValue]: {
      iconComponent: OrderCanceledIcon,
      color: 'var(--color-error)',
    },
    [AbacusOrderStatus.canceling.rawValue]: {
      iconComponent: OrderPendingIcon,
      color: 'var(--color-error)',
    },
    [AbacusOrderStatus.pending.rawValue]: {
      iconComponent: OrderPendingIcon,
      color: 'var(--color-text-2)',
    },
    [AbacusOrderStatus.untriggered.rawValue]: {
      iconComponent: OrderPendingIcon,
      color: 'var(--color-text-2)',
    },
  }[status];

  return <$Icon className={className} iconComponent={iconComponent} color={color} />;
};

const $Icon = styled(Icon)<{ color: string }>`
  color: ${({ color }) => color};
`;
