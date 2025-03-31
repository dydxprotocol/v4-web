import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { MarketLinks } from '@/views/MarketLinks';

import { useAppSelector } from '@/state/appTypes';

import { getAssetDescriptionStringKeys } from '@/lib/assetUtils';
import { hasText } from '@/lib/hasString';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

const AssetDetails = () => {
  const stringGetter = useStringGetter();
  const marketData = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.marketInfo));
  const { assetId, volume24H, marketCap, openInterestUSDC, nextFundingRate } = marketData;
  const { primary, secondary } = getAssetDescriptionStringKeys(assetId ?? '');

  const detailItems = useMemo(() => {
    const nextFundingRateBN = MustBigNumber(nextFundingRate);
    const fundingRateColor = nextFundingRateBN.isZero()
      ? 'text-color-text-2'
      : nextFundingRateBN.gt(0)
        ? 'text-color-green'
        : 'text-color-red';
    return [
      {
        key: 'volume',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.VOLUME })}</span>,
        value: <Output type={OutputType.CompactFiat} value={volume24H} />,
      },
      {
        key: 'marketCap',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.MARKET_CAP })}</span>,
        value: <Output type={OutputType.CompactFiat} value={marketCap} />,
      },
      {
        key: 'openInterest',
        label: <span tw="font-small-book">{stringGetter({ key: STRING_KEYS.OPEN_INTEREST })}</span>,
        value: <Output type={OutputType.CompactFiat} value={openInterestUSDC} />,
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
            value={nextFundingRate}
          />
        ),
      },
    ];
  }, [stringGetter, volume24H, marketCap, openInterestUSDC, nextFundingRate]);

  const primaryDescription = stringGetter({ key: primary });
  const secondaryDescription = stringGetter({ key: secondary });

  const hasDescription = hasText(primaryDescription) || hasText(secondaryDescription);

  return (
    <div tw="flexColumn gap-1">
      <div tw="flexColumn gap-1">
        <span tw="text-color-text-2 font-medium-bold">
          {stringGetter({ key: STRING_KEYS.DETAILS })}
        </span>
        <Details tw="text-color-text-2 font-base-book" withSeparators items={detailItems} />
      </div>

      <div tw="flexColumn gap-1">
        <div tw="row justify-between">
          <span tw="text-color-text-2 font-medium-bold">
            {stringGetter({ key: STRING_KEYS.ABOUT })}
          </span>
          <MarketLinks tw="[&>a]:text-color-text-2 [&>a]:visited:text-color-text-2" />
        </div>
        {hasDescription && (
          <>
            <p tw="font-small-book">{stringGetter({ key: primary })}</p>
            <p tw="font-small-book">{stringGetter({ key: secondary })}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetDetails;
