import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';

import { STRING_KEYS } from '@/constants/localization';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Details } from '@/components/Details';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { MarketLinks } from '@/views/MarketLinks';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { getAssetDescriptionStringKeys, getAssetFromMarketId } from '@/lib/assetUtils';
import { hasText } from '@/lib/hasString';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const AssetDetails = ({ isLaunchableMarket }: { isLaunchableMarket?: boolean }) => {
  const stringGetter = useStringGetter();
  const currentMarketId = useAppSelector(getCurrentMarketId);
  const assetId = getAssetFromMarketId(currentMarketId ?? '');
  const launchableAsset = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetInfo, assetId);
  const marketData = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.marketInfo));
  const { primary, secondary } = getAssetDescriptionStringKeys(marketData.assetId ?? '');
  const buyingPower = useAppSelector(BonsaiHelpers.currentMarket.account.buyingPower);

  const detailItems = useMemo(() => {
    if (isLaunchableMarket) {
      if (launchableAsset == null) {
        return [];
      }

      return [
        {
          key: 'volume',
          label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.VOLUME })}</span>,
          value: <Output type={OutputType.CompactFiat} value={launchableAsset.volume24h} />,
        },
        {
          key: 'marketCap',
          label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.MARKET_CAP })}</span>,
          value: (
            <Output
              type={OutputType.CompactFiat}
              value={launchableAsset.marketCap ?? launchableAsset.reportedMarketCap}
            />
          ),
        },
      ];
    }

    const nextFundingRateBN = MustBigNumber(marketData.nextFundingRate);
    const fundingRateColor = nextFundingRateBN.isZero()
      ? 'var(--color-text-2)'
      : nextFundingRateBN.gt(0)
        ? 'var(--color-positive)'
        : 'var(--color-negative)';

    return [
      {
        key: 'volume',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.VOLUME })}</span>,
        value: <Output type={OutputType.CompactFiat} value={marketData.volume24H} />,
      },
      {
        key: 'marketCap',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.MARKET_CAP })}</span>,
        value: <Output type={OutputType.CompactFiat} value={marketData.marketCap} />,
      },
      {
        key: 'openInterest',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.OPEN_INTEREST })}</span>,
        value: <Output type={OutputType.CompactFiat} value={marketData.openInterestUSDC} />,
      },
      {
        key: 'fundingRate',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.FUNDING_RATE })}</span>,
        value: (
          <Output
            css={{
              color: fundingRateColor,
            }}
            type={OutputType.SmallPercent}
            value={marketData.nextFundingRate}
            showSign={ShowSign.Both}
          />
        ),
      },
      {
        key: 'buyingPower',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.BUYING_POWER })}</span>,
        value: <Output type={OutputType.Fiat} value={buyingPower} />,
      },
    ];
  }, [stringGetter, buyingPower, launchableAsset, isLaunchableMarket, marketData]);

  const primaryDescription = stringGetter({ key: primary });
  const secondaryDescription = stringGetter({ key: secondary });

  const hasDescription = hasText(primaryDescription) || hasText(secondaryDescription);

  return (
    <div tw="flexColumn gap-1">
      <div tw="flexColumn">
        <span tw="text-color-text-2 font-medium-bold">
          {stringGetter({ key: STRING_KEYS.DETAILS })}
        </span>
        <Details
          tw="text-color-text-2 font-base-book"
          css={{
            '--color-border': 'var(--color-border-faded)',
          }}
          withSeparators
          items={detailItems}
        />
      </div>

      <div tw="flexColumn">
        {isLaunchableMarket ? (
          <MarketLinks
            launchableMarketId={currentMarketId}
            type="icons"
            tw="[&>a]:text-color-text-2 [&>a]:visited:text-color-text-2"
          />
        ) : (
          <div tw="row mb-0.25 justify-between">
            <span tw="text-color-text-2 font-medium-bold">
              {stringGetter({ key: STRING_KEYS.ABOUT })}
            </span>
            <MarketLinks
              type="menu"
              tw="font-large-book [&>a]:text-color-text-2 [&>a]:visited:text-color-text-2"
            />
          </div>
        )}
        {hasDescription && (
          <div>
            <p tw="font-small-book">{stringGetter({ key: primary })}</p>
            <p tw="font-small-book">{stringGetter({ key: secondary })}</p>
          </div>
        )}
      </div>
    </div>
  );
};
