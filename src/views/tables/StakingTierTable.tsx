import { useCallback, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { StakingTiers } from '@/bonsai/types/summaryTypes';
import styled, { css } from 'styled-components';
import { formatUnits } from 'viem';

import { STRING_KEYS } from '@/constants/localization';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { useStakingTierLevel } from '@/hooks/useStakingTierLevel';
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
  const userFeeTier = useAppSelector(BonsaiCore.account.stats.data).stakingTierId;
  const stakingTiers = useAppSelector(BonsaiCore.configs.stakingTiers);
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const currentStakingDiscountLevel: number | undefined = useStakingTierLevel();

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
        allowsSorting: false,
        isRowHeader: false,
        childColumns: [
          {
            columnKey: 'fee-tier',
            label: stringGetter({ key: STRING_KEYS.FEE_TIER }),
            allowsSorting: false,
            isRowHeader: true,
            renderCell: (row: StakingTier) => (
              <$TextRow tw="gap-0.5">
                <Output type={OutputType.Text} value={row.feeTierName} tw="text-color-text-0" />
                {row.feeTierName === userFeeTier && (
                  <Tag size={TagSize.Medium} tw="text-color-accent">
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
        label: (
          <$LevelLabel isHighlighted={currentStakingDiscountLevel === 1}>
            {stringGetter({ key: STRING_KEYS.LEVEL_N, params: { LEVEL: 1 } })}
          </$LevelLabel>
        ),
        allowsSorting: false,
        align: 'center' as const,
        isRowHeader: false,
        childColumns: [
          {
            columnKey: 'level-1-stake-requirements',
            label: stringGetter({ key: STRING_KEYS.STAKE_REQUIREMENTS }),
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ feeTierName, levels: [level1] }: StakingTier) => (
              <div tw="flex justify-end">
                <$HighlightOutput
                  tw="gap-0.25"
                  type={OutputType.Asset}
                  isHighlighted={feeTierName === userFeeTier && currentStakingDiscountLevel === 1}
                  value={calculateMinStakedTokens(level1?.minStakedBaseTokens)}
                  slotRight={<span>{chainTokenLabel}</span>}
                  fractionDigits={0}
                />
              </div>
            ),
          },
          {
            columnKey: 'level-1-discount',
            label: stringGetter({ key: STRING_KEYS.DISCOUNT }),
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ feeTierName, levels: [level1] }: StakingTier) => (
              <$HighlightOutput
                type={OutputType.Percent}
                isHighlighted={feeTierName === userFeeTier && currentStakingDiscountLevel === 1}
                value={MustBigNumber(level1?.feeDiscountPpm).div(QUANTUM_MULTIPLIER)}
              />
            ),
          },
        ],
      },
      {
        columnKey: 'level2',
        label: (
          <$LevelLabel isHighlighted={currentStakingDiscountLevel === 2}>
            {stringGetter({ key: STRING_KEYS.LEVEL_N, params: { LEVEL: 2 } })}
          </$LevelLabel>
        ),
        allowsSorting: false,
        align: 'center' as const,
        isRowHeader: false,
        childColumns: [
          {
            columnKey: 'level-2-stake-requirements',
            label: stringGetter({ key: STRING_KEYS.STAKE_REQUIREMENTS }),
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ feeTierName, levels: [, level2] }: StakingTier) => (
              <div tw="flex justify-end">
                <$HighlightOutput
                  tw="gap-0.25"
                  type={OutputType.Asset}
                  isHighlighted={feeTierName === userFeeTier && currentStakingDiscountLevel === 2}
                  value={calculateMinStakedTokens(level2?.minStakedBaseTokens)}
                  slotRight={<span>{chainTokenLabel}</span>}
                  fractionDigits={0}
                />
              </div>
            ),
          },
          {
            columnKey: 'level-2-discount',
            label: stringGetter({ key: STRING_KEYS.DISCOUNT }),
            allowsSorting: false,
            isRowHeader: true,
            renderCell: ({ feeTierName, levels: [, level2] }: StakingTier) => (
              <$HighlightOutput
                type={OutputType.Percent}
                isHighlighted={feeTierName === userFeeTier && currentStakingDiscountLevel === 2}
                value={MustBigNumber(level2?.feeDiscountPpm).div(QUANTUM_MULTIPLIER)}
              />
            ),
          },
        ],
      },
    ] satisfies ColumnDef<StakingTier>[];
  }, [
    stringGetter,
    chainTokenLabel,
    calculateMinStakedTokens,
    userFeeTier,
    currentStakingDiscountLevel,
  ]);

  return (
    <$StakingTierTable
      label={stringGetter({ key: STRING_KEYS.STAKING_TIERS })}
      data={stakingTiers ?? []}
      tableId="staking-tiers"
      getRowKey={(row: StakingTier) => row.feeTierName}
      getRowAttributes={(row: StakingTier) => ({
        'data-yours': row.feeTierName === userFeeTier && Boolean(currentStakingDiscountLevel),
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

const $HighlightOutput = styled(Output)<{ isHighlighted?: boolean }>`
  color: ${({ isHighlighted }) => (isHighlighted ? 'var(--color-accent)' : 'var(--color-text-1)')};
`;

const $LevelLabel = styled.span<{ isHighlighted: boolean }>`
  ${({ isHighlighted }) => css`
    color: ${isHighlighted ? 'var(--color-accent)' : 'var(--color-text-0)'};
  `}
`;
