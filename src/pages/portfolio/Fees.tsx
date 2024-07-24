import { useCallback, useMemo } from 'react';

import { Nullable } from '@dydxprotocol/v4-abacus';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';

import { FeeTier } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { FEE_DECIMALS } from '@/constants/numbers';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { Tag, TagSize } from '@/components/Tag';

import { getUserFeeTier, getUserStats } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getFeeTiers } from '@/state/configsSelectors';

import { isTruthy } from '@/lib/isTruthy';

const MARKET_SHARE_PERCENTAGE_FRACTION_DIGITS = 1;

const EQUALITY_SYMBOL_MAP = {
  '>=': '≥',
  '<=': '≤',
};

export const Fees = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const userFeeTier = useAppSelector(getUserFeeTier, shallowEqual);
  const userStats = useAppSelector(getUserStats, shallowEqual);
  const feeTiers = useAppSelector(getFeeTiers, shallowEqual);

  const volume = useMemo(() => {
    if (userStats.makerVolume30D !== undefined && userStats.takerVolume30D !== undefined) {
      return userStats.makerVolume30D + userStats.takerVolume30D;
    }
    return null;
  }, [userStats]);

  const AdditionalConditions = useCallback(
    (conditions: {
      totalShare: Nullable<number>;
      makerShare: Nullable<number>;
      isAdditional?: boolean;
    }) => {
      const { totalShare, makerShare, isAdditional } = conditions;
      return (
        <$AdditionalConditions>
          {!isAdditional && !totalShare && !makerShare && <Output type={OutputType.Text} />}
          {!!totalShare && (
            <$AdditionalConditionsText>
              {isAdditional && stringGetter({ key: STRING_KEYS.AND })}{' '}
              {stringGetter({ key: STRING_KEYS.EXCHANGE_MARKET_SHARE })}{' '}
              <$Highlighted>{'>'}</$Highlighted>{' '}
              <$HighlightOutput
                type={OutputType.Percent}
                value={totalShare}
                fractionDigits={MARKET_SHARE_PERCENTAGE_FRACTION_DIGITS}
              />
            </$AdditionalConditionsText>
          )}
          {!!makerShare && (
            <$AdditionalConditionsText>
              {isAdditional && stringGetter({ key: STRING_KEYS.AND })}{' '}
              {stringGetter({ key: STRING_KEYS.MAKER_MARKET_SHARE })}{' '}
              <$Highlighted>{'>'}</$Highlighted>{' '}
              <$HighlightOutput
                type={OutputType.Percent}
                value={makerShare}
                fractionDigits={MARKET_SHARE_PERCENTAGE_FRACTION_DIGITS}
              />
            </$AdditionalConditionsText>
          )}
        </$AdditionalConditions>
      );
    },
    [stringGetter]
  );

  return (
    <AttachedExpandingSection>
      {isNotTablet && <ContentSectionHeader title={stringGetter({ key: STRING_KEYS.FEES })} />}
      <div tw="flexColumn max-w-[100vw] gap-1.5">
        <$FeesDetails
          layout="grid"
          items={[
            {
              key: 'volume',
              label: (
                <$CardLabel>
                  <span>{stringGetter({ key: STRING_KEYS.TRAILING_VOLUME })}</span>
                  <span>{stringGetter({ key: STRING_KEYS._30D })}</span>
                </$CardLabel>
              ),
              value: <Output type={OutputType.Fiat} value={volume} />,
            },
          ]}
        />

        <$FeeTable
          label={stringGetter({ key: STRING_KEYS.FEE_TIERS })}
          data={feeTiers ?? []}
          getRowKey={(row: FeeTier) => row.tier}
          getRowAttributes={(row: FeeTier) => ({
            'data-yours': row.tier === userFeeTier,
          })}
          columns={(
            [
              {
                columnKey: 'tier',
                label: stringGetter({ key: STRING_KEYS.TIER }),
                allowsSorting: false,
                renderCell: ({ tier }) => (
                  <$TextRow tw="gap-0.5">
                    <Output type={OutputType.Text} value={tier} tw="text-text-0" />
                    {tier === userFeeTier && (
                      <Tag size={TagSize.Medium} tw="text-text-1">
                        {stringGetter({ key: STRING_KEYS.YOU })}
                      </Tag>
                    )}
                  </$TextRow>
                ),
              },
              {
                columnKey: 'volume',
                label: stringGetter({ key: STRING_KEYS.VOLUME_30D }),
                allowsSorting: false,
                renderCell: ({ symbol, volume: vol, makerShare, totalShare }) => (
                  <>
                    <span>{`${
                      symbol in EQUALITY_SYMBOL_MAP
                        ? EQUALITY_SYMBOL_MAP[symbol as keyof typeof EQUALITY_SYMBOL_MAP]
                        : symbol
                    } `}</span>
                    <$HighlightOutput type={OutputType.CompactFiat} value={vol} />
                    {isTablet &&
                      AdditionalConditions({ totalShare, makerShare, isAdditional: true })}
                  </>
                ),
              },
              isNotTablet && {
                columnKey: 'condition',
                label: stringGetter({ key: STRING_KEYS.ADDITIONAL_CONDITION }),
                allowsSorting: false,
                renderCell: ({ totalShare, makerShare }) =>
                  AdditionalConditions({ totalShare, makerShare }),
              },
              {
                columnKey: 'maker',
                label: stringGetter({ key: STRING_KEYS.MAKER }),
                allowsSorting: false,
                renderCell: ({ maker }) => (
                  <$HighlightOutput
                    type={OutputType.SmallPercent}
                    value={maker}
                    fractionDigits={FEE_DECIMALS}
                  />
                ),
              },
              {
                columnKey: 'taker',
                label: stringGetter({ key: STRING_KEYS.TAKER }),
                allowsSorting: false,
                renderCell: ({ taker }) => (
                  <$HighlightOutput
                    type={OutputType.SmallPercent}
                    value={taker}
                    fractionDigits={FEE_DECIMALS}
                  />
                ),
              },
            ] satisfies Array<false | ColumnDef<FeeTier>>
          ).filter(isTruthy)}
          selectionBehavior="replace"
          paginationBehavior="showAll"
          withOuterBorder={isNotTablet}
          withInnerBorders
        />
      </div>
    </AttachedExpandingSection>
  );
};
const $AdditionalConditions = styled.div`
  color: var(--color-text-0);
  font: var(--font-small-book);

  > :nth-child(2) {
    font: var(--font-small-book);
  }
`;

const $AdditionalConditionsText = styled.span`
  display: flex;
  gap: 0.5ch;
  justify-content: end;

  @media ${breakpoints.mobile} {
    display: inline;
    max-width: 8rem;
    min-width: 0;

    output {
      display: inline;
    }
  }
`;

const $FeesDetails = styled(Details)`
  gap: 1rem;

  @media ${breakpoints.notTablet} {
    margin: 0 1.25rem;
  }

  @media ${breakpoints.tablet} {
    padding: 1rem 1rem 0 1rem;
    --details-grid-numColumns: 1;
  }

  > div {
    max-width: 16rem;

    gap: 1rem;

    padding: 1rem;
    border-radius: 0.625rem;
    background-color: var(--color-layer-3);

    @media ${breakpoints.tablet} {
      max-width: 100%;
    }
  }

  dt {
    width: 100%;
  }

  output {
    font: var(--font-base-book);
  }
`;

const $TextRow = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
`;

const $CardLabel = styled($TextRow)`
  font: var(--font-small-book);

  color: var(--color-text-1);

  @media ${breakpoints.tablet} {
    font: var(--font-mini-book);
  }

  > :nth-child(2) {
    color: var(--color-text-0);
  }
`;

const $FeeTable = styled(Table)`
  --tableCell-padding: 0.5rem 1.5rem;
  --bordered-content-border-radius: 0.625rem;
  --table-cell-align: end;

  font: var(--font-base-book);

  @media ${breakpoints.mobile} {
    --tableCell-padding: 1rem 1.25rem;
    font: var(--font-small-book);
  }

  tbody tr {
    &[data-yours='true'] {
      background-color: var(--color-layer-3);

      td:first-child {
        border-left: 0.125rem solid var(--color-accent);
      }
    }
  }

  @media ${breakpoints.notTablet} {
    --tableStickyRow-backgroundColor: var(--color-layer-1);
  }
` as typeof Table;
const $Highlighted = tw.strong`text-text-1`;

const $HighlightOutput = tw(Output)`text-text-1 `;
