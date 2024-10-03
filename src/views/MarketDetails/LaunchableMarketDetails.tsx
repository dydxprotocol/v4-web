import { STRING_KEYS } from '@/constants/localization';
import { LIQUIDITY_TIERS } from '@/constants/markets';

import { useMetadataServiceAssetFromId } from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';

import { DetailsItem } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';

import { getDisplayableTickerFromMarket } from '@/lib/assetUtils';
import { BIG_NUMBERS } from '@/lib/numbers';

import { MarketDetails } from './MarketDetails';

const ISOLATED_LIQUIDITY_TIER_INFO = LIQUIDITY_TIERS[4];

export const LaunchableMarketDetails = ({ launchableMarketId }: { launchableMarketId: string }) => {
  const stringGetter = useStringGetter();
  const launchableAsset = useMetadataServiceAssetFromId(launchableMarketId);

  if (!launchableAsset) return null;

  const { name, id, logo, urls, marketCap, volume24h } = launchableAsset;
  const { website, technicalDoc, cmc } = urls;

  const items = [
    {
      key: 'market-name',
      label: stringGetter({ key: STRING_KEYS.MARKET_NAME }),
      value: name,
    },
    {
      key: 'market-cap',
      label: stringGetter({ key: STRING_KEYS.MARKET_CAP }),
      value: <Output useGrouping value={marketCap} type={OutputType.Fiat} />,
    },
    {
      key: 'volume-24h',
      label: stringGetter({ key: STRING_KEYS.SPOT_VOLUME_24H }),
      value: <Output useGrouping value={volume24h} type={OutputType.Fiat} />,
    },
    {
      key: 'ticker',
      label: stringGetter({ key: STRING_KEYS.TICKER }),
      value: getDisplayableTickerFromMarket(`${id}-USD`),
    },
    {
      key: 'market-type',
      label: stringGetter({ key: STRING_KEYS.TYPE }),
      value: stringGetter({ key: STRING_KEYS.ISOLATED }),
    },
    {
      key: 'max-leverage',
      label: stringGetter({ key: STRING_KEYS.MAXIMUM_LEVERAGE }),
      tooltip: 'maximum-leverage',
      value: (
        <Output
          useGrouping
          value={
            ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction
              ? BIG_NUMBERS.ONE.div(ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction)
              : null
          }
          type={OutputType.Multiple}
        />
      ),
    },
    {
      key: 'maintenance-margin-fraction',
      label: stringGetter({ key: STRING_KEYS.MAINTENANCE_MARGIN_FRACTION }),
      tooltip: 'maintenance-margin-fraction',
      value: (
        <Output
          useGrouping
          value={ISOLATED_LIQUIDITY_TIER_INFO.maintenanceMarginFraction}
          type={OutputType.SmallPercent}
        />
      ),
    },
    {
      key: 'initial-margin-fraction',
      label: stringGetter({ key: STRING_KEYS.INITIAL_MARGIN_FRACTION }),
      tooltip: 'initial-margin-fraction',
      value: (
        <Output
          useGrouping
          value={ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction}
          type={OutputType.SmallPercent}
        />
      ),
    },
  ] satisfies DetailsItem[];

  return (
    <MarketDetails
      assetName={name}
      assetIcon={{ logoUrl: logo }}
      marketDetailItems={items}
      urls={{ technicalDoc, website, cmc }}
    />
  );
};
