import styled, { type AnyStyledComponent } from 'styled-components';

import { tableMixins } from '@/styles/tableMixins';

export const TableColumnHeader = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => <Styled.HeaderCellContent className={className}>{children}</Styled.HeaderCellContent>;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.HeaderCellContent = styled.div`
  ${tableMixins.headerCellContent}
`;
