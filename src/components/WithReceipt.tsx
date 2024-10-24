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
    return children;
  }

  const receipt = <$SlotReceipt>{slotReceipt}</$SlotReceipt>;

  return (
    <$WithReceipt className={className} showReceipt={!hideReceipt}>
      {side === 'top' && receipt}
      {children}
      {side === 'bottom' && receipt}
    </$WithReceipt>
  );
};

const $SlotReceipt = styled.div``;

const $WithReceipt = styled.div<{ showReceipt?: boolean }>`
  --withReceipt-backgroundColor: var(--color-layer-1);

  background-color: transparent;
  border-radius: 0.5em;

  display: grid;
  grid-template-rows: 0fr;

  ${$SlotReceipt} {
    overflow: hidden;
  }

  ${({ showReceipt }) =>
    showReceipt &&
    css`
      grid-template-rows: 1fr;
      background-color: var(--withReceipt-backgroundColor);
    `}
`;
