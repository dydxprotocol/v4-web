import styled, { css } from 'styled-components';

import { tableMixins } from '@/styles/tableMixins';

export const TableCell = ({
  className,
  children,
  slotLeft,
  slotRight,
  stacked,
  stackedWithSecondaryStyling = stacked,
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
  <$CellContent isHighlighted={isHighlighted} className={className}>
    {slotLeft}
    {!!stacked || stackedWithSecondaryStyling ? (
      <$Column stackedWithSecondaryStyling={stackedWithSecondaryStyling}>{children}</$Column>
    ) : (
      children
    )}
    {slotRight}
  </$CellContent>
);
const $CellContent = styled.div<{ isHighlighted?: boolean }>`
  ${tableMixins.cellContent}

  ${({ isHighlighted }) =>
    isHighlighted &&
    css`
      --primary-content-color: var(--color-text-2);
      --secondary-content-color: var(--color-text-1);
    `}
`;

const $Column = styled.div<{ stackedWithSecondaryStyling?: boolean }>`
  ${({ stackedWithSecondaryStyling }) =>
    stackedWithSecondaryStyling
      ? tableMixins.cellContentColumnSecondary
      : tableMixins.cellContentColumn}
`;
