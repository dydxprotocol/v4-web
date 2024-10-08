import BigNumber from 'bignumber.js';
import { shallowEqual } from 'react-redux';

import { PerpetualMarketType } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import { BIG_NUMBERS } from '@/lib/numbers';

import { MarketDetails } from './MarketDetails';

export const CurrentMarketDetails = () => {
  const stringGetter = useStringGetter();
  const { configs, displayId } = useAppSelector(getCurrentMarketData, shallowEqual) ?? {};
  const { id, name, resources } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};

  if (!configs) return null;

  const {
    tickSize,
    stepSize,
    initialMarginFraction,
    effectiveInitialMarginFraction,
    maintenanceMarginFraction,
    minOrderSize,
    perpetualMarketType,
    stepSizeDecimals,
    tickSizeDecimals,
  } = configs;

  const {
    coinMarketCapsLink,
    primaryDescriptionKey,
    secondaryDescriptionKey,
    websiteLink,
    whitepaperLink,
  } = resources ?? {};

  const preferEIMF = Boolean(
    effectiveInitialMarginFraction && initialMarginFraction !== effectiveInitialMarginFraction
  );

  const items = [
    {
      key: 'ticker',
      label: stringGetter({ key: STRING_KEYS.TICKER }),
      value: displayId,
    },
    {
      key: 'market-type',
      label: stringGetter({ key: STRING_KEYS.TYPE }),
      value:
        perpetualMarketType === PerpetualMarketType.CROSS
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
          tag={id}
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
          value={minOrderSize}
          type={OutputType.Asset}
          tag={id}
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
      assetIcon={{ symbol: id }}
      marketDetailItems={items}
      primaryDescription={stringGetter({ key: `APP.${primaryDescriptionKey}` })}
      secondaryDescription={stringGetter({ key: `APP.${secondaryDescriptionKey}` })}
      urls={{ technicalDoc: whitepaperLink, website: websiteLink, cmc: coinMarketCapsLink }}
    />
  );
};
