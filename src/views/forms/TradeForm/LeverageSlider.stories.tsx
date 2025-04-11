import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled from 'styled-components';

import breakpoints from '@/styles/breakpoints';

import { LeverageSlider } from './LeverageSlider';
import { StoryWrapper } from '.ladle/components';

export const LeverageSliderStory: Story<Parameters<typeof LeverageSlider>[0]> = (args) => {
  const [leverage, setLeverage] = useState('');

  return (
    <StoryWrapper>
      <$PositionInfoContainer>
        <LeverageSlider {...args} leverageInput={leverage} setLeverageInputValue={setLeverage} />
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
  leftLeverageSigned: 0,
  rightLeverageSigned: 10,
};
