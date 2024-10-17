import { Nullable, SubaccountPosition, type Asset, type PerpetualMarket } from '@/constants/abacus';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { MapOf, safeAssign } from './objectHelpers';

type HydratedPositionData = SubaccountPosition & {
  asset?: Asset;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
  oraclePrice: Nullable<number>;
};

export const getHydratedPositionData = ({
  data,
  assets,
  perpetualMarkets,
}: {
  data: SubaccountPosition;
  assets?: MapOf<Asset>;
  perpetualMarkets?: MapOf<PerpetualMarket>;
}): HydratedPositionData => {
  return safeAssign({}, data, {
    asset: assets?.[data.assetId],
    stepSizeDecimals: perpetualMarkets?.[data.id]?.configs?.stepSizeDecimals ?? TOKEN_DECIMALS,
    tickSizeDecimals: perpetualMarkets?.[data.id]?.configs?.tickSizeDecimals ?? USD_DECIMALS,
    oraclePrice: perpetualMarkets?.[data.id]?.oraclePrice,
  });
};
