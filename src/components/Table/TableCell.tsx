import styled, { type AnyStyledComponent } from 'styled-components';

import { tableMixins } from '@/styles/tableMixins';

export const TableCell = ({
  className,
  children,
  slotLeft,
  slotRight,
  stacked,
}: {
  className?: string;
  children?: React.ReactNode;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;
  stacked?: boolean;
}) => (
  <Styled.CellContent className={className}>
    {slotLeft}
    {stacked ? <Styled.Column>{children}</Styled.Column> : children}
    {slotRight}
  </Styled.CellContent>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.CellContent = styled.div`
  ${tableMixins.cellContent}
`;

Styled.Column = styled.div`
  ${tableMixins.cellContentColumn}
`;
