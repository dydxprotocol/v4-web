import { OrderSide } from '@dydxprotocol/v4-client-js';

import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { BigNumberish } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

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
  return (
    <div tw="row gap-0.25">
      <OrderSideTag orderSide={orderSide} />
      <Output tw="text-color-text-2" type={OutputType.Asset} value={filledAmount} />
      <span tw="text-color-text-2">{getDisplayableAssetFromBaseAsset(assetId)}</span>
      <span>@</span>
      <Output
        tw="text-color-text-2"
        withSubscript
        type={OutputType.Fiat}
        value={averagePrice}
        fractionDigits={tickSizeDecimals}
      />
    </div>
  );
};
