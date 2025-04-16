import { PerpetualMarketSummary } from '@/bonsai/types/summaryTypes';

import { AssetIcon } from '@/components/AssetIcon';

import { TableCell } from './TableCell';

export const MarketSummaryTableCell = ({
  marketSummary,
}: {
  marketSummary?: PerpetualMarketSummary;
}) => {
  return (
    <TableCell
      tw="font-bold text-color-text-2"
      slotLeft={
        <AssetIcon
          tw="[--asset-icon-size:1.25rem] tablet:[--asset-icon-size:2.25rem]"
          logoUrl={marketSummary?.logo}
          symbol={marketSummary?.assetId}
        />
      }
    >
      {marketSummary?.displayableAsset ?? ''}
    </TableCell>
  );
};
