import { MouseEventHandler } from 'react';

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
  onClick,
}: {
  className?: string;
  children?: React.ReactNode;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;
  stacked?: boolean;
  isHighlighted?: boolean;
  stackedWithSecondaryStyling?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) => (
  <$CellContent
    isHighlighted={isHighlighted}
    className={className}
    onClick={onClick}
    css={
      onClick
        ? {
            cursor: 'pointer',
          }
        : undefined
    }
  >
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
