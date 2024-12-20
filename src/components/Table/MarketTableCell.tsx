import { AssetInfo } from '@/abacus-ts/rawTypes';

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
          logoUrl={asset?.resources?.imageUrl}
          symbol={asset?.id}
          tw="text-[1.25rem] tablet:text-[2.25rem]"
        />
      }
    >
      {getDisplayableAssetFromBaseAsset(asset?.id ?? '')}
    </TableCell>
  );
};

export const MarketTableCellNew = ({ asset }: { asset?: AssetInfo }) => {
  return (
    <TableCell
      tw="font-bold text-color-text-2"
      slotLeft={
        <AssetIcon
          logoUrl={asset?.logo}
          symbol={asset?.id}
          tw="text-[1.25rem] tablet:text-[2.25rem]"
        />
      }
    >
      {getDisplayableAssetFromBaseAsset(asset?.id ?? '')}
    </TableCell>
  );
};
