import type { WalletQueries } from '@sdk/Accounts';
import { monomemo } from '@sdk/shared/lib/memo';
import { UsdValue } from '@sdk/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import { type PositionsQueries, filterPositionsByAccountAddress } from '../../Positions';

export interface GetCurrentAccountTotalExposureQueryDependencies {
  walletQueries: WalletQueries;
  positionsQueries: PositionsQueries;
}

export const createGetCurrentAccountTotalExposureQuery = (
  deps: GetCurrentAccountTotalExposureQueryDependencies
) => {
  const currentAccountAddressGetter = deps.walletQueries.getCurrentUserAddress;
  const allPositionsGetter = deps.positionsQueries.getAllLatestPositions;

  const getCurrentAccountTotalExposure = monomemo(
    (
      currentAccountAddress: ReturnType<typeof currentAccountAddressGetter>,
      allPositions: ReturnType<typeof allPositionsGetter>
    ): UsdValue => {
      if (!currentAccountAddress) {
        return zero(UsdValue);
      }

      const userPositions = filterPositionsByAccountAddress(allPositions, currentAccountAddress);
      const openPositions = userPositions.filter((p) =>
        deps.positionsQueries.isPositionOpen(p.stableId)
      );

      return openPositions.reduce((totalExposure, position) => {
        const positionNotional = DecimalCalculator.value(BigIntMath.abs(position.size)).calculate(
          UsdValue
        );

        return DecimalCalculator.value(totalExposure).add(positionNotional).calculate(UsdValue);
      }, zero(UsdValue));
    }
  );

  return () => getCurrentAccountTotalExposure(currentAccountAddressGetter(), allPositionsGetter());
};
