import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { useNavigate } from 'react-router-dom';

import { AppRoute } from '@/constants/routes';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';

import { AssetIcon } from '@/components/AssetIcon';
import { BackButton } from '@/components/BackButton';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { MidMarketPrice } from '@/views/MidMarketPrice';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { getAssetFromMarketId, getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { isPresent, orEmptyObj } from '@/lib/typeUtils';

export const AssetHeader = ({ isLaunchableMarket }: { isLaunchableMarket?: boolean }) => {
  const navigate = useNavigate();
  const currentMarketId = useAppSelector(getCurrentMarketId);

  const assetId =
    useAppSelector(BonsaiHelpers.currentMarket.assetId) ??
    getAssetFromMarketId(currentMarketId ?? '');

  const launchableAsset = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetInfo, assetId);
  const marketInfo = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.marketInfo));

  const { marketCap, displayableAsset, percentChange24h, logo } = useMemo(() => {
    if (isLaunchableMarket) {
      return {
        marketCap: launchableAsset?.marketCap ?? launchableAsset?.reportedMarketCap,
        displayableAsset: getDisplayableAssetFromBaseAsset(launchableAsset?.assetId),
        percentChange24h: launchableAsset?.percentChange24h
          ? MustBigNumber(launchableAsset.percentChange24h).div(100).toNumber()
          : undefined,
        logo: launchableAsset?.logo,
      };
    }

    return {
      marketCap: marketInfo.marketCap,
      displayableAsset: marketInfo.displayableAsset,
      percentChange24h: marketInfo.percentChange24h,
      logo: marketInfo.logo,
    };
  }, [marketInfo, launchableAsset, isLaunchableMarket]);

  const assetPrice = isLaunchableMarket ? (
    <Output tw="font-medium-bold" type={OutputType.Fiat} value={launchableAsset?.price} />
  ) : (
    <MidMarketPrice tw="font-medium-bold" richColor={false} />
  );

  return (
    <div tw="inlineRow justify-between gap-[1ch] bg-color-layer-2 p-[1.25rem_1.25rem_0.5rem_0.5rem]">
      <div tw="inlineRow">
        <BackButton tw="text-color-text-0" onClick={() => navigate(AppRoute.Markets)} />
        <AssetIcon
          logoUrl={logo}
          symbol={displayableAsset}
          css={{
            '--asset-icon-size': '2.25rem',
          }}
        />
        <div tw="flexColumn gap-0.125">
          <span tw="!leading-[18px] text-color-text-2 font-medium-bold">{displayableAsset}</span>
          {isPresent(marketCap) && (
            <span tw="font-small-medium">
              <Output
                tw="inline"
                type={OutputType.CompactFiat}
                value={marketCap}
                slotRight={<span tw="ml-0.25 text-color-text-0">MC</span>}
              />
            </span>
          )}
        </div>
      </div>

      <div tw="flexColumn items-end justify-end gap-0.125">
        {assetPrice}
        <Output
          tw="font-small-medium"
          css={{
            color: MustBigNumber(percentChange24h).isZero()
              ? undefined
              : MustBigNumber(percentChange24h).gt(0)
                ? 'var(--color-positive)'
                : 'var(--color-negative)',
          }}
          type={OutputType.Percent}
          showSign={ShowSign.None}
          value={percentChange24h}
        />
      </div>
    </div>
  );
};
