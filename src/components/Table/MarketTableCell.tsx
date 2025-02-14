import { PerpetualMarketSummary } from '@/bonsai/types/summaryTypes';

import type { Asset } from '@/constants/abacus';

import { AssetIcon } from '@/components/AssetIcon';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';

import { TableCell } from './TableCell';

export const MarketTableCell = ({ asset }: { asset?: Asset }) => {
  return (
    <TableCell
      tw="font-bold text-color-text-2"
      slotLeft={
        <AssetIcon
          tw="[--asset-icon-size:1.25rem] tablet:[--asset-icon-size:2.25rem]"
          logoUrl={asset?.resources?.imageUrl}
          symbol={asset?.id}
        />
      }
    >
      {getDisplayableAssetFromBaseAsset(asset?.id ?? '')}
    </TableCell>
  );
};

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
