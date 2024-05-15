import styled, { type AnyStyledComponent } from 'styled-components';

import { tableMixins } from '@/styles/tableMixins';

export const TableColumnHeader = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => <$HeaderCellContent className={className}>{children}</$HeaderCellContent>;
const $HeaderCellContent = styled.div`
  ${tableMixins.headerCellContent}
`;
