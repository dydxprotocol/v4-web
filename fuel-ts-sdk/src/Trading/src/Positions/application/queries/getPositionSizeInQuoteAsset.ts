import type { StoreService } from '@sdk/shared/lib/StoreService';
import { multimemo } from '@sdk/shared/lib/memo';
import type { PositionStableId } from '@sdk/shared/types';
import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import { PositionSize } from '../../domain';
import { selectLatestPositionByStableId } from '../../infrastructure';

export interface GetPositionSizeInQuoteAssetQueryDependencies {
  storeService: StoreService;
}

export const createGetPositionSizeInQuoteAssetQuery = (
  deps: GetPositionSizeInQuoteAssetQueryDependencies
) => {
  const positionGetter = (id: PositionStableId) =>
    deps.storeService.select((s) => selectLatestPositionByStableId(s, id));

  const getPositionSizeInQuoteAsset = multimemo((position: ReturnType<typeof positionGetter>) => {
    if (!position) return zero(PositionSize);

    const sizeInUsdc = position.size;
    const markPrice = position.entryPrice;

    return DecimalCalculator.value(sizeInUsdc).divideBy(markPrice).calculate(PositionSize);
  });

  return (positionId: PositionStableId) => getPositionSizeInQuoteAsset(positionGetter(positionId));
};
