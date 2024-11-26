import { OrderSide } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Details } from '@/components/Details';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { BigNumberish } from '@/lib/numbers';

export const FillDetails = ({
  orderSide,
  filledAmount,
  assetId,
  averagePrice,
  tickSizeDecimals,
}: {
  orderSide: OrderSide;
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
          value: (
            <Output
              type={OutputType.Asset}
              value={filledAmount}
              tag={getDisplayableAssetFromBaseAsset(assetId)}
            />
          ),
        },
        {
          key: 'price',
          label: stringGetter({ key: STRING_KEYS.PRICE }),
          value: (
            <Output
              withSubscript
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
