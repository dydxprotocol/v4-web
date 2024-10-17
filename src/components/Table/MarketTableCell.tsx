import type { Asset } from '@/constants/abacus';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { testFlags } from '@/lib/testFlags';

import { Output, OutputType, ShowSign } from '../Output';
import { TableCell } from './TableCell';

export const MarketTableCell = ({
  asset,
  marketId,
  leverage,
  showFavorite,
  isHighlighted,
  className,
}: {
  asset?: Asset;
  marketId: string;
  leverage?: number;
  showFavorite?: boolean;
  isHighlighted?: boolean;
  className?: string;
}) => {
  const { uiRefresh } = testFlags;
  return uiRefresh ? (
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
  ) : (
    <TableCell
      className={className}
      isHighlighted={isHighlighted}
      stacked
      slotLeft={
        <>
          {showFavorite && <Icon iconName={IconName.Star} />}
          <AssetIcon
            logoUrl={asset?.resources?.imageUrl}
            symbol={asset?.id}
            tw="text-[1.25rem] tablet:text-[2.25rem]"
          />
        </>
      }
    >
      {leverage ? (
        <>
          <span>{marketId}</span>
          <Output type={OutputType.Multiple} value={leverage} showSign={ShowSign.None} />
        </>
      ) : (
        <>
          <span tw="tablet:text-color-text-2">{asset?.name}</span>
          <span>{marketId}</span>
        </>
      )}
    </TableCell>
  );
};
