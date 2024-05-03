import { OrderSide } from '@dydxprotocol/v4-client-js';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { TradeTypes } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';

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
  filledAmount: any;
  assetId?: string;
  averagePrice?: any;
  tickSizeDecimals?: number;
}) => {
  const stringGetter = useStringGetter();
  return (
    <Styled.Details
      items={[
        {
          key: 'size',
          label: (
            <Styled.Label>
              {stringGetter({ key: STRING_KEYS.SIZE })}
              <OrderSideTag orderSide={orderSide} />
            </Styled.Label>
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

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Label = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

Styled.Details = styled(Details)`
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
