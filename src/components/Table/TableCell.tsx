import styled, { css, type AnyStyledComponent } from 'styled-components';

import { tableMixins } from '@/styles/tableMixins';

export const TableCell = ({
  className,
  children,
  slotLeft,
  slotRight,
  stacked,
  stackedWithSecondaryStyling = true,
  isHighlighted,
}: {
  className?: string;
  children?: React.ReactNode;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;
  stacked?: boolean;
  isHighlighted?: boolean;
  stackedWithSecondaryStyling?: boolean;
}) => (
  <Styled.CellContent isHighlighted={isHighlighted} className={className}>
    {slotLeft}
    {stacked || stackedWithSecondaryStyling ? (
      <Styled.Column stackedWithSecondaryStyling={stackedWithSecondaryStyling}>
        {children}
      </Styled.Column>
    ) : (
      children
    )}
    {slotRight}
  </Styled.CellContent>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.CellContent = styled.div<{ isHighlighted?: boolean }>`
  ${tableMixins.cellContent}

  ${({ isHighlighted }) =>
    isHighlighted &&
    css`
      --primary-content-color: var(--color-text-2);
      --secondary-content-color: var(--color-text-1);
    `}
`;

Styled.Column = styled.div<{ stackedWithSecondaryStyling?: boolean }>`
  ${({ stackedWithSecondaryStyling }) =>
    stackedWithSecondaryStyling
      ? tableMixins.cellContentColumnSecondary
      : tableMixins.cellContentColumn}
`;
