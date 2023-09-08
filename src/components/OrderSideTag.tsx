import { OrderSide } from '@dydxprotocol/v4-client-js';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { Tag, TagSign, TagSize, TagType } from './Tag';

type ElementProps = {
  orderSide: OrderSide;
};

type StyleProps = {
  size?: TagSize;
};

export const orderSideTagSign: Record<OrderSide, TagSign> = {
  [OrderSide.BUY]: TagSign.Positive,
  [OrderSide.SELL]: TagSign.Negative,
};

export const OrderSideTag = ({ size, orderSide }: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <Tag size={size} type={TagType.Side} sign={orderSideTagSign[orderSide]}>
      {stringGetter({
        key: {
          [OrderSide.BUY]: STRING_KEYS.BUY,
          [OrderSide.SELL]: STRING_KEYS.SELL,
        }[orderSide],
      })}
    </Tag>
  );
};
