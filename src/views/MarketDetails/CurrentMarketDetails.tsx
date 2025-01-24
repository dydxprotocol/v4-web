import { BonsaiHelpers } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerPerpetualMarketType } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';

import { DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';

import { getAssetDescriptionStringKeys } from '@/lib/assetUtils';
import { BIG_NUMBERS } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { MarketDetails } from './MarketDetails';

export const CurrentMarketDetails = () => {
  const stringGetter = useStringGetter();
  const currentMarketData = useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo);

  const {
    displayableAsset,
    displayableTicker,
    effectiveInitialMarginFraction,
    initialMarginFraction,
    maintenanceMarginFraction,
    marketType,
    tickSize,
    tickSizeDecimals,
    stepSize,
    stepSizeDecimals,
  } = orEmptyObj(currentMarketData);

  const { assetId, logo, name, urls } = orEmptyObj(currentMarketData);
  const { cmc, website, technicalDoc } = orEmptyObj(urls);
  const { primary, secondary } = getAssetDescriptionStringKeys(assetId ?? '');

  const preferEIMF = Boolean(
    effectiveInitialMarginFraction &&
      initialMarginFraction !== effectiveInitialMarginFraction.toString()
  );

  const items = [
    {
      key: 'ticker',
      label: stringGetter({ key: STRING_KEYS.TICKER }),
      value: displayableTicker,
    },
    {
      key: 'market-type',
      label: stringGetter({ key: STRING_KEYS.TYPE }),
      value:
        marketType === IndexerPerpetualMarketType.CROSS
          ? stringGetter({ key: STRING_KEYS.CROSS })
          : stringGetter({ key: STRING_KEYS.ISOLATED }),
    },
    {
      key: 'tick-size',
      label: stringGetter({ key: STRING_KEYS.TICK_SIZE }),
      tooltip: 'tick-size',
      value: (
        <Output
          useGrouping
          value={tickSize}
          type={OutputType.Fiat}
          fractionDigits={tickSizeDecimals}
        />
      ),
    },
    {
      key: 'step-size',
      label: stringGetter({ key: STRING_KEYS.STEP_SIZE }),
      tooltip: 'step-size',
      value: (
        <Output
          useGrouping
          value={stepSize}
          type={OutputType.Asset}
          tag={displayableAsset}
          fractionDigits={stepSizeDecimals}
        />
      ),
    },
    {
      key: 'min-order-size',
      label: stringGetter({ key: STRING_KEYS.MINIMUM_ORDER_SIZE }),
      value: (
        <Output
          useGrouping
          value={stepSize}
          type={OutputType.Asset}
          tag={displayableAsset}
          fractionDigits={stepSizeDecimals}
        />
      ),
    },
    {
      key: 'max-leverage',
      label: stringGetter({ key: STRING_KEYS.MAXIMUM_LEVERAGE }),
      tooltip: 'maximum-leverage',
      value: (
        <DiffOutput
          value={initialMarginFraction ? BIG_NUMBERS.ONE.div(initialMarginFraction) : null}
          newValue={
            effectiveInitialMarginFraction
              ? BIG_NUMBERS.ONE.div(effectiveInitialMarginFraction)
              : null
          }
          withDiff={preferEIMF}
          type={OutputType.Multiple}
        />
      ),
    },
    {
      key: 'maintenance-margin-fraction',
      label: stringGetter({ key: STRING_KEYS.MAINTENANCE_MARGIN_FRACTION }),
      tooltip: 'maintenance-margin-fraction',
      value: (
        <Output useGrouping value={maintenanceMarginFraction} type={OutputType.SmallPercent} />
      ),
    },
    {
      key: 'initial-margin-fraction',
      label: stringGetter({ key: STRING_KEYS.INITIAL_MARGIN_FRACTION }),
      tooltip: 'initial-margin-fraction',
      value: (
        <DiffOutput
          value={initialMarginFraction ? BigNumber(initialMarginFraction) : null}
          newValue={
            effectiveInitialMarginFraction ? BigNumber(effectiveInitialMarginFraction) : null
          }
          withDiff={preferEIMF}
          type={OutputType.SmallPercent}
        />
      ),
    },
  ] satisfies DetailsItem[];

  return (
    <MarketDetails
      assetName={name}
      assetIcon={{ symbol: assetId, logoUrl: logo }}
      marketDetailItems={items}
      primaryDescription={stringGetter({ key: primary })}
      secondaryDescription={stringGetter({ key: secondary })}
      urls={{ technicalDoc, website, cmc }}
    />
  );
};
