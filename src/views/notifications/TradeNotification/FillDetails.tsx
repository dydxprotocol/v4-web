import { OrderSide } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { TradeTypes } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Details } from '@/components/Details';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';

import { BigNumberish } from '@/lib/numbers';

export const FillDetails = ({
  orderSide,
  tradeType,
  filledAmount,
  assetId,
  averagePrice,
  tickSizeDecimals,
}: {
  orderSide: OrderSide;
  tradeType?: TradeTypes;
  filledAmount: Nullable<BigNumberish>;
  assetId?: string;
  averagePrice?: BigNumberish;
  tickSizeDecimals?: number;
}) => {
  const stringGetter = useStringGetter();
  return (
    <$Details
      items={[
        {
          key: 'size',
          label: (
            <span tw="row gap-[0.5ch]">
              {stringGetter({ key: STRING_KEYS.SIZE })}
              <OrderSideTag orderSide={orderSide} />
            </span>
          ),
          value: <Output type={OutputType.Asset} value={filledAmount} tag={assetId} />,
        },
        {
          key: 'price',
          label: stringGetter({ key: STRING_KEYS.PRICE }),
          value:
            tradeType === TradeTypes.MARKET ? (
              <span>{stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT })}</span>
            ) : (
              <Output
                type={OutputType.Fiat}
                value={averagePrice}
                fractionDigits={tickSizeDecimals}
              />
            ),
        },
      ]}
    />
  );
};
const $Details = styled(Details)`
  --details-item-height: 1rem;

  dd {
    color: var(--color-text-2);
  }

  div {
    padding: 0.25rem 0;
  }

  div:last-of-type {
    padding-bottom: 0;
  }
`;
