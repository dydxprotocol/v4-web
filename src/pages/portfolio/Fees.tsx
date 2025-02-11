import { useCallback, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { FeeTierSummary } from '@/bonsai/types/summaryTypes';
import { Nullable } from '@dydxprotocol/v4-abacus';
import { DoubleArrowUpIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { FEE_DECIMALS } from '@/constants/numbers';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Details } from '@/components/Details';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { Tag, TagSize } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { truncateAddress } from '@/lib/wallet';

const MARKET_SHARE_PERCENTAGE_FRACTION_DIGITS = 1;

const EQUALITY_SYMBOL_MAP = {
  '>=': '≥',
  '<=': '≤',
};

export const Fees = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const userStats = useAppSelector(BonsaiCore.account.stats.data);
  const feeTiers = useAppSelector(BonsaiCore.configs.feeTiers);
  const { referredBy } = useSubaccount();
  const { affiliateProgramFaq } = useURLConfigs();

  const volume = useMemo(() => {
    if (userStats.makerVolume30D !== undefined && userStats.takerVolume30D !== undefined) {
      return userStats.makerVolume30D + userStats.takerVolume30D;
    }
    return null;
  }, [userStats]);

  const userFeeTier = userStats.feeTierId;

  const hasReceivedFeeTierBonus =
    userFeeTier === '3' &&
    referredBy !== undefined &&
    MustBigNumber(volume).lt(feeTiers?.[2]?.volume ?? 0);

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
        <div tw="flex flex-row">
          <$FeesDetails
            layout="grid"
            hasReceivedFeeTierBonus={hasReceivedFeeTierBonus}
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
              hasReceivedFeeTierBonus && {
                key: 'bonus',
                label: (
                  <$CardLabel>
                    {stringGetter({
                      key: STRING_KEYS.YOUR_FEE_TIER,
                      params: {
                        TIER: (
                          <span tw="text-color-text-2">
                            {userFeeTier}{' '}
                            <DoubleArrowUpIcon tw="mb-[-1px] inline h-0.75 w-0.75 text-color-positive" />
                          </span>
                        ),
                      },
                    })}
                  </$CardLabel>
                ),
                value: (
                  <span tw="font-mini-book">
                    {stringGetter({
                      key: STRING_KEYS.GIFTED_FEE_TIER_BONUS,
                      params: {
                        AFFILIATE: truncateAddress(referredBy),
                      },
                    })}{' '}
                    <Link
                      tw="inline-flex text-color-accent visited:text-color-accent"
                      href={affiliateProgramFaq}
                    >
                      {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                    </Link>
                  </span>
                ),
              },
            ].filter(isTruthy)}
          />
        </div>

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
                        {AdditionalConditions({ totalShare, makerShare, isAdditional: true })}
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
            ] satisfies Array<false | ColumnDef<FeeTierSummary>>
          ).filter(isTruthy)}
          selectionBehavior="replace"
          paginationBehavior="showAll"
          withOuterBorder
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

const $FeesDetails = styled(Details)<{ hasReceivedFeeTierBonus?: boolean }>`
  gap: 1rem;
  --details-grid-numColumns: ${({ hasReceivedFeeTierBonus }) => (hasReceivedFeeTierBonus ? 2 : 1)};

  @media ${breakpoints.notTablet} {
    margin: 0 1.25rem;
  }

  @media ${breakpoints.tablet} {
    padding: 1rem 1rem 0 1rem;
    --details-grid-numColumns: 1;
  }

  > div {
    max-width: 16rem;
    align-content: normal;

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
  height: 1.5rem;
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
    --tableStickyRow-backgroundColor: var(--color-layer-2);
  }
` as typeof Table;
const $Highlighted = tw.strong`text-color-text-1`;

const $HighlightOutput = tw(Output)`text-color-text-1`;
