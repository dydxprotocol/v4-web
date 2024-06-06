import { useState } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { PositionSide } from '@/constants/trade';

import breakpoints from '@/styles/breakpoints';

import { LeverageSlider } from './LeverageSlider';
import { StoryWrapper } from '.ladle/components';

export const LeverageSliderStory: Story<Parameters<typeof LeverageSlider>[0]> = (args) => {
  const [leverage, setLeverage] = useState('');

  return (
    <StoryWrapper>
      <$PositionInfoContainer>
        <LeverageSlider
          {...args}
          leverageInputValue={leverage}
          setLeverageInputValue={setLeverage}
        />
      </$PositionInfoContainer>
    </StoryWrapper>
  );
};
const $PositionInfoContainer = styled.div`
  height: 4.625rem;
  margin: auto;
  position: relative;

  display: grid;
  grid-template-columns: minmax(0, 23.75rem);
  justify-content: center;
  padding: 2rem 2rem 0;

  @media ${breakpoints.desktopLarge} {
    padding: 3rem 2rem 0;
  }
`;

LeverageSliderStory.args = {
  leverage: 1,
  maxLeverage: 10,
};

LeverageSliderStory.argTypes = {
  positionSide: {
    options: Object.values(PositionSide),
    control: { type: 'select' },
    defaultValue: PositionSide.Long,
  },
  orderSide: {
    options: Object.values(OrderSide),
    control: { type: 'select' },
    defaultValue: OrderSide.BUY,
  },
};
