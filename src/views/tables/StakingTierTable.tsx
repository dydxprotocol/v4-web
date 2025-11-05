import { useCallback, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { StakingTiers } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits } from 'viem';

import { STRING_KEYS } from '@/constants/localization';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { Tag, TagSize } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

type StakingTier = StakingTiers[number];

export const StakingTierTable = () => {
  const stringGetter = useStringGetter();
  const feeTiers = useAppSelector(BonsaiCore.configs.feeTiers);
  const userFeeTier = useAppSelector(BonsaiCore.account.stats.data).feeTierId;
  const stakingTiers = useAppSelector(BonsaiCore.configs.stakingTiers);
  const { chainTokenDecimals, chainTokenDenom } = useTokenConfigs();

  const calculateMinStakedTokens = useCallback(
    (minStakedBaseTokens?: string) => {
      return minStakedBaseTokens
        ? formatUnits(BigInt(minStakedBaseTokens), chainTokenDecimals)
        : undefined;
    },
    [chainTokenDecimals]
  );

  const columns: ColumnDef<StakingTier>[] = useMemo(() => {
    return [
      {
        columnKey: 'tier',
        label: ' ',
        isRowHeader: false,
        allowsSorting: false,
        childColumns: [
          {
            columnKey: 'fee-tier',
            label: stringGetter({ key: STRING_KEYS.FEE_TIERS }),
            allowsSorting: false,
            colspan: 1,
            isRowHeader: true,
            renderCell: (row: StakingTier) => (
              <$TextRow tw="gap-0.5">
                <Output type={OutputType.Text} value={row.feeTierName} tw="text-color-text-0" />
                {row.feeTierName === userFeeTier && (
                  <Tag size={TagSize.Medium} tw="text-color-text-1">
                    {stringGetter({ key: STRING_KEYS.YOU })}
                  </Tag>
                )}
              </$TextRow>
            ),
          },
        ],
      },
      {
        columnKey: 'level1',
        label: 'Level 1',
        allowsSorting: false,
        align: 'center' as const,
        isRowHeader: false,
        childColumns: [
          {
            columnKey: 'level-1-stake-requirements',
            label: 'Stake Requirements',
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ levels: [level1] }: StakingTier) => (
              <div tw="flex flex-col">
                <div tw="flex flex-row justify-end gap-0.25">
                  <$HighlightOutput
                    type={OutputType.Asset}
                    value={calculateMinStakedTokens(level1?.minStakedBaseTokens)}
                    fractionDigits={0}
                  />
                  <span tw="text-color-text-1">{chainTokenDenom}</span>
                </div>
              </div>
            ),
          },
          {
            columnKey: 'level-1-discount',
            label: stringGetter({ key: STRING_KEYS.DISCOUNT }),
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ levels: [level1] }: StakingTier) => (
              <$HighlightOutput
                type={OutputType.Percent}
                fractionDigits={0}
                value={MustBigNumber(level1?.feeDiscountPpm).div(QUANTUM_MULTIPLIER)}
              />
            ),
          },
        ],
      },
      {
        columnKey: 'level2',
        label: 'Level 2',
        allowsSorting: false,
        align: 'center' as const,
        isRowHeader: false,
        childColumns: [
          {
            columnKey: 'level-2-stake-requirements',
            label: 'Stake Requirements',
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ levels: [, level2] }: StakingTier) => (
              <div tw="flex flex-col">
                <div tw="flex flex-row justify-end gap-0.25">
                  <$HighlightOutput
                    type={OutputType.Asset}
                    value={calculateMinStakedTokens(level2?.minStakedBaseTokens)}
                    fractionDigits={0}
                  />
                  <span tw="text-color-text-1">{chainTokenDenom}</span>
                </div>
              </div>
            ),
          },
          {
            columnKey: 'level-2-discount',
            label: stringGetter({ key: STRING_KEYS.DISCOUNT }),
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ levels: [, level2] }: StakingTier) => (
              <$HighlightOutput
                type={OutputType.Percent}
                fractionDigits={0}
                value={MustBigNumber(level2?.feeDiscountPpm).div(QUANTUM_MULTIPLIER)}
              />
            ),
          },
        ],
      },
    ] satisfies ColumnDef<StakingTier>[];
  }, [stringGetter, chainTokenDenom, calculateMinStakedTokens, userFeeTier]);

  return (
    <$StakingTierTable
      label={stringGetter({ key: STRING_KEYS.STAKING_TIERS })}
      data={stakingTiers ?? []}
      tableId="staking-tiers"
      getRowKey={(row: StakingTier) => row.feeTierName}
      getRowAttributes={(row: StakingTier) => ({
        'data-yours': row.feeTierName === userFeeTier,
      })}
      columns={columns}
      selectionBehavior="replace"
      paginationBehavior="showAll"
      withOuterBorder
      withInnerBorders
    />
  );
};

const $StakingTierTable = styled(Table)`
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

const $TextRow = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
`;

const $HighlightOutput = tw(Output)`text-color-text-1`;

// Notes
