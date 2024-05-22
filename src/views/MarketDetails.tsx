import BigNumber from 'bignumber.js';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { PerpetualMarketType } from '@/constants/abacus';
import { ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import { BIG_NUMBERS } from '@/lib/numbers';

import { MarketLinks } from './MarketLinks';

export const MarketDetails: React.FC = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { configs, market } = useAppSelector(getCurrentMarketData, shallowEqual) ?? {};
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
      key: 'market-name',
      label: stringGetter({ key: STRING_KEYS.MARKET_NAME }),
      value: market,
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
  ];

  return (
    <$MarketDetails>
      <$Header>
        <$WrapRow>
          <$MarketTitle>
            <AssetIcon symbol={id} />
            {name}
          </$MarketTitle>
          {isTablet && <$MarketLinks />}
        </$WrapRow>

        <$MarketDescription>
          {primaryDescriptionKey && <p>{stringGetter({ key: `APP.${primaryDescriptionKey}` })}</p>}
          {secondaryDescriptionKey && (
            <p>{stringGetter({ key: `APP.${secondaryDescriptionKey}` })}</p>
          )}
        </$MarketDescription>

        {!isTablet && (
          <$Buttons>
            {whitepaperLink && (
              <Button
                type={ButtonType.Link}
                shape={ButtonShape.Pill}
                size={ButtonSize.Small}
                href={whitepaperLink}
                slotRight={<Icon iconName={IconName.LinkOut} />}
              >
                {stringGetter({ key: STRING_KEYS.WHITEPAPER })}
              </Button>
            )}
            {websiteLink && (
              <Button
                type={ButtonType.Link}
                shape={ButtonShape.Pill}
                size={ButtonSize.Small}
                href={websiteLink}
                slotRight={<Icon iconName={IconName.LinkOut} />}
              >
                {stringGetter({ key: STRING_KEYS.WEBSITE })}
              </Button>
            )}
            {coinMarketCapsLink && (
              <Button
                type={ButtonType.Link}
                shape={ButtonShape.Pill}
                size={ButtonSize.Small}
                href={coinMarketCapsLink}
                slotRight={<Icon iconName={IconName.LinkOut} />}
              >
                CoinmarketCap
              </Button>
            )}
          </$Buttons>
        )}
      </$Header>

      <$Details items={items} withSeparators />
    </$MarketDetails>
  );
};

const $MarketDetails = styled.div`
  margin: auto;
  width: 100%;

  ${layoutMixins.gridConstrainedColumns}
  --grid-max-columns: 2;
  --column-gap: 2.25em;
  --column-min-width: 18rem;
  --column-max-width: 22rem;
  --single-column-max-width: 25rem;

  justify-content: center;
  align-items: center;
  padding: clamp(0.5rem, 7.5%, 2.5rem);
  row-gap: 1rem;

  @media ${breakpoints.tablet} {
    padding: 0 clamp(0.5rem, 7.5%, 2.5rem);
  }
`;
const $Header = styled.header`
  ${layoutMixins.column}
  gap: 1.25rem;
`;
const $WrapRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;

  flex-wrap: wrap;
`;
const $MarketTitle = styled.h3`
  ${layoutMixins.row}
  font: var(--font-large-medium);
  gap: 0.5rem;

  img {
    width: 2.25rem;
    height: 2.25rem;
  }
`;
const $MarketLinks = styled(MarketLinks)`
  place-self: start end;
`;
const $MarketDescription = styled.div`
  ${layoutMixins.column}
  gap: 0.5em;

  p {
    font: var(--font-small-book);

    &:last-of-type {
      color: var(--color-text-0);
    }
  }
`;
const $Buttons = styled.div`
  ${layoutMixins.row}
  flex-wrap: wrap;
  gap: 0.5rem;

  overflow-x: auto;
`;
const $Details = styled(Details)`
  font: var(--font-mini-book);
`;
