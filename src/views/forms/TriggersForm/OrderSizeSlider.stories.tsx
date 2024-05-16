import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { TOKEN_DECIMALS } from '@/constants/numbers';

import { breakpoints } from '@/styles';

import { OrderSizeSlider } from './OrderSizeSlider';
import { StoryWrapper } from '.ladle/components';

export const OrderSizeSliderStory: Story<Parameters<typeof OrderSizeSlider>[0]> = (args) => {
  const [size, setSize] = useState(20);

  return (
    <StoryWrapper>
      <$Container>
        <OrderSizeSlider
          setAbacusSize={() => null}
          setOrderSizeInput={(sizeString: string) => setSize(parseFloat(sizeString))}
          size={size}
          stepSizeDecimals={TOKEN_DECIMALS}
          positionSize={100}
        />
      </$Container>
    </StoryWrapper>
  );
};
const $Container = styled.div`
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
