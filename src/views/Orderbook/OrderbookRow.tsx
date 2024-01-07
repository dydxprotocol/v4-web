import styled from 'styled-components';

import { OrderbookLine } from '@/constants/abacus';
export type RowData = OrderbookLine & { side: 'bid' | 'ask'; mine?: number };

export const ROW_HEIGHT = 20;
export const ROW_PADDING_RIGHT = 8;

export const Row = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: ${ROW_HEIGHT}px;
  min-height: ${ROW_HEIGHT}px;

  font: var(--font-mini-book);

  position: relative;
  padding-right: 0.5rem;

  > span {
    flex: 1 1 0%;
    text-align: right;
    padding-bottom: 2px;
  }
`;
