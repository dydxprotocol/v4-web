import styled from 'styled-components';

import { Details, type DetailsItem } from '@/components/Details';
import { WithReceipt } from '@/components/WithReceipt';

type ElementProps = {
  detailItems?: DetailsItem[];
  children: React.ReactNode;
};

type StyleProps = {
  className?: string;
  hideReceipt?: boolean;
  side?: 'top' | 'bottom';
};

export type WithDetailsReceiptProps = ElementProps & StyleProps;

export const WithDetailsReceipt = ({
  children,
  className,
  hideReceipt,
  detailItems,
  side,
}: WithDetailsReceiptProps) => (
  <WithReceipt
    className={className}
    hideReceipt={hideReceipt}
    side={side}
    slotReceipt={detailItems && <$Details items={detailItems} />}
  >
    {children}
  </WithReceipt>
);
const $Details = styled(Details)`
  --details-item-backgroundColor: var(--withReceipt-backgroundColor);
  --details-item-vertical-padding: 0.33rem;

  padding: 0.375rem 0.75rem 0.25rem;

  font-size: var(--details-item-fontSize, 0.8125em);
`;
