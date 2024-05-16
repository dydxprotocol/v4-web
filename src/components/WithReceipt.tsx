import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

type ElementProps = {
  slotReceipt?: ReactNode;
  children: ReactNode;
};

type StyleProps = {
  className?: string;
  hideReceipt?: boolean;
  side?: 'top' | 'bottom';
};

export const WithReceipt = ({
  slotReceipt,
  className,
  hideReceipt,
  side = 'top',
  children,
}: ElementProps & StyleProps) => {
  if (!slotReceipt) {
    return <>{children}</>;
  }

  const receipt = <$SlotReceipt>{slotReceipt}</$SlotReceipt>;

  return (
    <$WithReceipt className={className} hideReceipt={hideReceipt}>
      {side === 'top' && receipt}
      {children}
      {side === 'bottom' && receipt}
    </$WithReceipt>
  );
};
const $WithReceipt = styled.div<{ hideReceipt?: boolean }>`
  --withReceipt-backgroundColor: var(--color-layer-1);
  display: grid;

  background-color: var(--withReceipt-backgroundColor);
  border-radius: 0.5em;

  ${({ hideReceipt }) =>
    hideReceipt &&
    css`
      background-color: transparent;

      ${$SlotReceipt} {
        height: 0;
        opacity: 0;
      }
    `}
`;

const $SlotReceipt = styled.div``;
