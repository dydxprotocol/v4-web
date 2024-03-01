import { type ReactNode } from 'react';

import styled, { type AnyStyledComponent, css } from 'styled-components';

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

  const receipt = <Styled.SlotReceipt>{slotReceipt}</Styled.SlotReceipt>;

  return (
    <Styled.WithReceipt className={className} hideReceipt={hideReceipt}>
      {side === 'top' && receipt}
      {children}
      {side === 'bottom' && receipt}
    </Styled.WithReceipt>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.WithReceipt = styled.div<{ hideReceipt?: boolean }>`
  --withReceipt-backgroundColor: var(--color-layer-1);
  display: grid;

  background-color: var(--withReceipt-backgroundColor);
  border-radius: 0.5em;

  ${({ hideReceipt }) =>
    hideReceipt &&
    css`
      background-color: transparent;

      ${Styled.SlotReceipt} {
        height: 0;
        opacity: 0;
      }
    `}
`;

Styled.SlotReceipt = styled.div``;
