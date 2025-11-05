import { useCallback } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { FeeTierSummary } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { FEE_DECIMALS } from '@/constants/numbers';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { Tag, TagSize } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';
import { Nullable } from '@/lib/typeUtils';

const MARKET_SHARE_PERCENTAGE_FRACTION_DIGITS = 1;

const EQUALITY_SYMBOL_MAP = {
  '>=': '≥',
  '<=': '≤',
};

export const FeeTierTable = () => {
  const stringGetter = useStringGetter();
  const feeTiers = useAppSelector(BonsaiCore.configs.feeTiers);
  const userStats = useAppSelector(BonsaiCore.account.stats.data);
  const { isTablet, isNotTablet } = useBreakpoints();

  const userFeeTier = userStats.feeTierId;
  const makerFeeRate = userStats.makerFeeRate;
  const takerFeeRate = userStats.takerFeeRate;

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
    <$FeeTable
      label={stringGetter({ key: STRING_KEYS.FEE_TIERS })}
      data={feeTiers ?? []}
      tableId="fees"
      getRowKey={(row: FeeTierSummary) => row.tier}
      getRowAttributes={(row: FeeTierSummary) => ({
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
                <Output type={OutputType.Text} value={tier} tw="text-color-text-0" />
                {tier === userFeeTier && (
                  <Tag size={TagSize.Medium} tw="text-color-text-1">
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
              <div tw="flex flex-col">
                <div tw="flex flex-row justify-end gap-0.25">
                  <span>{`${
                    symbol in EQUALITY_SYMBOL_MAP
                      ? EQUALITY_SYMBOL_MAP[symbol as keyof typeof EQUALITY_SYMBOL_MAP]
                      : symbol
                  } `}</span>
                  <$HighlightOutput type={OutputType.CompactFiat} value={vol} />
                </div>
                {isTablet && (
                  <div tw="flex justify-end">
                    {AdditionalConditions({
                      totalShare,
                      makerShare,
                      isAdditional: true,
                    })}
                  </div>
                )}
              </div>
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
            renderCell: ({ tier, maker }) => {
              if (tier === userFeeTier && maker !== makerFeeRate) {
                return (
                  <span>
                    <Output
                      tw="text-color-text-0 line-through"
                      type={OutputType.SmallPercent}
                      value={maker}
                      fractionDigits={FEE_DECIMALS}
                    />{' '}
                    <Output
                      tw="text-color-accent"
                      type={OutputType.SmallPercent}
                      value={makerFeeRate}
                    />
                  </span>
                );
              }

              return (
                <$HighlightOutput
                  type={OutputType.SmallPercent}
                  value={maker}
                  fractionDigits={FEE_DECIMALS}
                />
              );
            },
          },
          {
            columnKey: 'taker',
            label: stringGetter({ key: STRING_KEYS.TAKER }),
            allowsSorting: false,
            renderCell: ({ tier, taker }) => {
              if (tier === userFeeTier && taker !== takerFeeRate) {
                return (
                  <span>
                    <Output
                      tw="text-color-text-0 line-through"
                      type={OutputType.SmallPercent}
                      value={taker}
                      fractionDigits={FEE_DECIMALS}
                    />{' '}
                    <Output
                      tw="text-color-accent"
                      type={OutputType.SmallPercent}
                      value={takerFeeRate}
                    />
                  </span>
                );
              }
              return (
                <$HighlightOutput
                  type={OutputType.SmallPercent}
                  value={taker}
                  fractionDigits={FEE_DECIMALS}
                />
              );
            },
          },
        ] satisfies Array<false | ColumnDef<FeeTierSummary>>
      ).filter(isTruthy)}
      selectionBehavior="replace"
      paginationBehavior="showAll"
      withOuterBorder
      withInnerBorders
    />
  );
};

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
    --tableStickyRow-backgroundColor: var(--color-layer-2);
  }
` as typeof Table;

const $AdditionalConditions = styled.div`
  color: var(--color-text-0);
  font: var(--font-small-book);

  > :nth-child(2) {
    font: var(--font-small-book);
  }

  @media ${breakpoints.mobile} {
    max-width: 6rem;
  }
`;

const $AdditionalConditionsText = styled.span`
  display: flex;
  gap: 0.5ch;
  justify-content: end;
  align-items: flex-end;

  @media ${breakpoints.mobile} {
    display: inline;
    min-width: 0;

    output {
      display: inline;
    }

    :after {
      content: ' ';
    }
  }
`;

const $TextRow = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
`;

const $Highlighted = tw.strong`text-color-text-1`;

const $HighlightOutput = tw(Output)`text-color-text-1`;
