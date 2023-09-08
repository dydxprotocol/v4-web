import type { Story } from '@ladle/react';
import { StoryWrapper } from '.ladle/components';

import styled, { AnyStyledComponent } from 'styled-components';
import { breakpoints } from '@/styles';

import { PositionTile } from './PositionTile';

export const PositionTileStory: Story<Parameters<typeof PositionTile>[0]> = (args) => (
  <StoryWrapper>
    <Styled.PositionInfoContainer>
      <PositionTile {...args} />
    </Styled.PositionInfoContainer>
  </StoryWrapper>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.PositionInfoContainer = styled.div`
  display: grid;
  height: 4.625rem;
  margin: auto;
  position: relative;

  grid-template-columns: minmax(0, 23.75rem);
  justify-content: center;
  padding: 2rem 2rem 0;

  @media ${breakpoints.desktopLarge} {
    padding: 3rem 2rem 0;
  }
`;

PositionTileStory.args = {
  currentSize: 0.2,
  oraclePrice: 1300,
  postOrderSize: 0.2,
  stepSizeDecimals: 3,
  symbol: 'ETH',
  tickSizeDecimals: 1,
};
