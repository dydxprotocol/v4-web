import type { Story } from '@ladle/react';
import { OrderSide } from '@dydxprotocol/v4-client';

import { OrderSideTag } from '@/components/OrderSideTag';

import { StoryWrapper } from '.ladle/components';

export const BuyTagStory: Story<{ orderSide: OrderSide }> = (args) => {
  return (
    <StoryWrapper>
      <OrderSideTag orderSide={args.orderSide} />
    </StoryWrapper>
  );
};

BuyTagStory.args = {
  orderSide: OrderSide.BUY,
};

export const SellTagStory: Story<{ orderSide: OrderSide }> = (args) => {
  return (
    <StoryWrapper>
      <OrderSideTag orderSide={args.orderSide} />
    </StoryWrapper>
  );
};

SellTagStory.args = {
  orderSide: OrderSide.SELL,
};
