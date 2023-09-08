import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS, type StringKey } from '@/constants/localization';
import { useBreakpoints, useStringGetter } from '@/hooks';
import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import { BIG_NUMBERS } from '@/lib/numbers';

import { MarketLinks } from './MarketLinks';

export const MarketDetails: React.FC = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { configs, market } = useSelector(getCurrentMarketData, shallowEqual) || {};
  const { symbol, name, resources } = useSelector(getCurrentMarketAssetData, shallowEqual) || {};

  if (!configs) return null;

  const {
    tickSize,
    stepSize,
    initialMarginFraction,
    maintenanceMarginFraction,
    minOrderSize,
    stepSizeDecimals,
    tickSizeDecimals,
  } = configs;

  const {
    coinMarketCapsLink,
    primaryDescriptionKey,
    secondaryDescriptionKey,
    websiteLink,
    whitepaperLink,
  } = resources || {};

  const items = [
    {
      key: 'market-name',
      label: stringGetter({ key: STRING_KEYS.MARKET_NAME }),
      value: market,
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
          tag={symbol}
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
          tag={symbol}
          fractionDigits={stepSizeDecimals}
        />
      ),
    },
    {
      key: 'max-leverage',
      label: stringGetter({ key: STRING_KEYS.MAXIMUM_LEVERAGE }),
      tooltip: 'maximum-leverage',
      value: (
        <Output
          useGrouping
          value={initialMarginFraction ? BIG_NUMBERS.ONE.div(initialMarginFraction) : null}
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
      value: <Output useGrouping value={initialMarginFraction} type={OutputType.SmallPercent} />,
    },
  ];

  return (
    <Styled.MarketDetails>
      <Styled.Header>
        <Styled.WrapRow>
          <Styled.MarketTitle>
            <AssetIcon symbol={symbol} />
            {name}
          </Styled.MarketTitle>
          {isTablet && <Styled.MarketLinks />}
        </Styled.WrapRow>

        <Styled.MarketDescription>
          {primaryDescriptionKey && (
            <p>{stringGetter({ key: STRING_KEYS[primaryDescriptionKey as StringKey] })}</p>
          )}
          {secondaryDescriptionKey && (
            <p>{stringGetter({ key: STRING_KEYS[secondaryDescriptionKey as StringKey] })}</p>
          )}
        </Styled.MarketDescription>

        {!isTablet && (
          <Styled.Buttons>
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
          </Styled.Buttons>
        )}
      </Styled.Header>

      <Styled.Details items={items} withSeparators />
    </Styled.MarketDetails>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketDetails = styled.div`
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

Styled.Header = styled.header`
  /* max-width: fit-content; */

  ${layoutMixins.column}
  gap: 1.25rem;

  position: sticky;
  bottom: 3rem;
`;

Styled.WrapRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;

  flex-wrap: wrap;
`;

Styled.MarketTitle = styled.h3`
  ${layoutMixins.row}
  font: var(--font-large-medium);
  gap: 0.5rem;

  img {
    width: 2.25rem;
    height: 2.25rem;
  }
`;

Styled.MarketLinks = styled(MarketLinks)`
  place-self: start end;
`;

Styled.MarketDescription = styled.div`
  ${layoutMixins.column}
  gap: 0.5em;

  p {
    font: var(--font-small-book);

    &:last-of-type {
      color: var(--color-text-0);
    }
  }
`;

Styled.Buttons = styled.div`
  ${layoutMixins.row}
  flex-wrap: wrap;
  gap: 0.5rem;

  overflow-x: auto;
`;

Styled.Details = styled(Details)`
  font: var(--font-mini-book);
`;
