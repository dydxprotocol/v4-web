import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { DYDXBalancePanel } from './DYDXBalancePanel';

export const RewardsPage = () => (
  <Styled.Page>
    <DYDXBalancePanel />
  </Styled.Page>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.centered}
`;
