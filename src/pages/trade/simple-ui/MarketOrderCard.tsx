import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountOrder } from '@/bonsai/types/summaryTypes';

import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { TagSize } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { orEmptyObj } from '@/lib/typeUtils';

export const MarketOrderCard = ({ order }: { order: SubaccountOrder }) => {
  const stringGetter = useStringGetter();
  const { stepSizeDecimals = TOKEN_DECIMALS, tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const orderLabel = ORDER_TYPE_STRINGS[order.type].orderTypeKey;

  const orderInfo = [
    {
      label: stringGetter({ key: STRING_KEYS.LIMIT_PRICE }),
      value: (
        <Output type={OutputType.Fiat} value={order.price} fractionDigits={tickSizeDecimals} />
      ),
    },
    {
      label: stringGetter({ key: STRING_KEYS.SIZE }),
      value: (
        <Output type={OutputType.Number} value={order.size} fractionDigits={stepSizeDecimals} />
      ),
    },
    {
      label: stringGetter({ key: STRING_KEYS.AMOUNT_FILLED }),
      value: (
        <Output
          type={OutputType.Number}
          value={order.totalFilled}
          fractionDigits={stepSizeDecimals}
        />
      ),
    },
  ];

  return (
    <div tw="flexColumn gap-[0.125rem] overflow-hidden rounded-1">
      <div tw="row gap-0.5 bg-color-layer-3 p-0.75">
        <div>{stringGetter({ key: orderLabel })}</div>
        <OrderSideTag size={TagSize.Medium} orderSide={order.side} />
      </div>
      <div tw="grid grid-cols-3 gap-0.5 bg-color-layer-3 p-0.75">
        {orderInfo.map((info) => (
          <div key={info.label}>
            <div tw="text-color-text-0 font-mini-book">{info.label}</div>
            <div tw="text-color-text-2">{info.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
