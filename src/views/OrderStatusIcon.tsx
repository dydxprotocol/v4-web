import styled from 'styled-components';

import { AbacusOrderStatus } from '@/constants/abacus';
import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  status: string;
  totalFilled: number;
};

type StyleProps = {
  className?: string;
};

export const OrderStatusIcon = ({ className, status, totalFilled }: ElementProps & StyleProps) => {
  const { iconName, color } = {
    [AbacusOrderStatus.open.rawValue]:
      totalFilled > 0
        ? {
            iconName: IconName.OrderPartiallyFilled,
            color: 'var(--color-warning)',
          }
        : {
            iconName: IconName.OrderOpen,
            color: 'var(--color-text-2)',
          },
    [AbacusOrderStatus.partiallyFilled.rawValue]: {
      iconName: IconName.OrderPartiallyFilled,
      color: 'var(--color-warning)',
    },
    [AbacusOrderStatus.filled.rawValue]: {
      iconName: IconName.OrderFilled,
      color: 'var(--color-success)',
    },
    [AbacusOrderStatus.cancelled.rawValue]: {
      iconName: IconName.OrderCanceled,
      color: 'var(--color-error)',
    },
    [AbacusOrderStatus.canceling.rawValue]: {
      iconName: IconName.OrderPending,
      color: 'var(--color-error)',
    },
    [AbacusOrderStatus.pending.rawValue]: {
      iconName: IconName.OrderPending,
      color: 'var(--color-text-2)',
    },
    [AbacusOrderStatus.untriggered.rawValue]: {
      iconName: IconName.OrderPending,
      color: 'var(--color-text-2)',
    },
  }[status];

  return <$Icon className={className} iconName={iconName} color={color} />;
};

const $Icon = styled(Icon)<{ color: string }>`
  color: ${({ color }) => color};
`;
