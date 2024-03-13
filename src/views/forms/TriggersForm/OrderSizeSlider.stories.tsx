import type { Story } from '@ladle/react';
import styled, { AnyStyledComponent } from 'styled-components';

import { breakpoints } from '@/styles';

import { OrderSizeSlider } from './OrderSizeSlider';
import { StoryWrapper } from '.ladle/components';

export const OrderSizeSliderStory: Story<Parameters<typeof OrderSizeSlider>[0]> = (args) => {
  return (
    <StoryWrapper>
      <Styled.Container>
        <OrderSizeSlider />
      </Styled.Container>
    </StoryWrapper>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
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
