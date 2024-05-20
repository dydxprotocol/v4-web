import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { Story } from '@ladle/react';

import { OrderSideTag } from '@/components/OrderSideTag';

import { StoryWrapper } from '.ladle/components';

export const BuyTagStory: Story<{ orderSide: OrderSide }> = ({
  orderSide,
}: {
  orderSide: OrderSide;
}) => {
  return (
    <StoryWrapper>
      <OrderSideTag orderSide={orderSide} />
    </StoryWrapper>
  );
};

BuyTagStory.args = {
  orderSide: OrderSide.BUY,
};

export const SellTagStory: Story<{ orderSide: OrderSide }> = ({
  orderSide,
}: {
  orderSide: OrderSide;
}) => {
  return (
    <StoryWrapper>
      <OrderSideTag orderSide={orderSide} />
    </StoryWrapper>
  );
};

SellTagStory.args = {
  orderSide: OrderSide.SELL,
};
