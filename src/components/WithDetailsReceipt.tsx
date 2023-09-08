import styled, { type AnyStyledComponent } from 'styled-components';

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
    slotReceipt={detailItems && <Styled.Details items={detailItems} />}
  >
    {children}
  </WithReceipt>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Details = styled(Details)`
  --details-item-backgroundColor: var(--withReceipt-backgroundColor);

  padding: 0.375rem 0.75rem 0.25rem;

  font-size: 0.8125em;
`;
