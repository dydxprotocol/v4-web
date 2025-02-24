import { useState } from 'react';

import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { IAffiliateLeaderboardStats, IAffiliateStats } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesLeaderboard } from '@/hooks/useAffiliatesLeaderboard';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Output, OutputType } from '@/components/Output';
import { AllTableProps, Table, type ColumnDef } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

enum AffiliateEpochsFilter {
  ALL = 'all',
}

export const AFFILIATE_FILTERS_OPTIONS: Record<
  AffiliateEpochsFilter,
  {
    label?: string;
  }
> = {
  [AffiliateEpochsFilter.ALL]: {
    label: STRING_KEYS.ALL_TIME,
  },
};

interface IAffiliatesFilterProps {
  selectedFilter: AffiliateEpochsFilter;
  filters: AffiliateEpochsFilter[];
  onChangeFilter: (filter: AffiliateEpochsFilter) => void;
  compactLayout?: boolean;
}

const AffiliatesFilter = ({
  selectedFilter,
  filters,
  onChangeFilter,
  compactLayout = false,
}: IAffiliatesFilterProps) => {
  const stringGetter = useStringGetter();

  return (
    <$AffiliatesFilter $compactLayout={compactLayout}>
      <div tw="row">
        <$ToggleGroupContainer $compactLayout={compactLayout}>
          <$ToggleGroup
            items={Object.values(filters).map((value) => ({
              label: stringGetter({
                key: AFFILIATE_FILTERS_OPTIONS[value].label,
                fallback: value,
              }),
              value,
            }))}
            value={selectedFilter}
            onValueChange={onChangeFilter}
          />
        </$ToggleGroupContainer>
      </div>
    </$AffiliatesFilter>
  );
};

export const AffiliatesLeaderboard = () => {
  const { isTablet } = useBreakpoints();
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const affiliatesFilters = Object.values(AffiliateEpochsFilter);
  const [epochFilter, setEpochFilter] = useState<AffiliateEpochsFilter>(AffiliateEpochsFilter.ALL);
  const { data: affiliates } = useAffiliatesLeaderboard();

  const columns: ColumnDef<IAffiliateLeaderboardStats>[] = isTablet
    ? [
        {
          columnKey: 'rank',
          label: stringGetter({ key: STRING_KEYS.RANK }),
          renderCell: ({ rank, affiliateAddress }) => {
            return (
              <TableCell>
                {rank}

                {affiliateAddress && affiliateAddress === dydxAddress && (
                  <Tag tw="bg-color-accent">{stringGetter({ key: STRING_KEYS.YOU })}</Tag>
                )}
              </TableCell>
            );
          },
          allowsSorting: false,
        },
        {
          columnKey: 'account',
          label: stringGetter({ key: STRING_KEYS.ACCOUNT }),
          allowsSorting: false,

          renderCell: ({ affiliateReferralCode }) => (
            <$AccountOutput type={OutputType.Text} value={affiliateReferralCode} />
          ),
        },
        {
          columnKey: 'total-earnings',
          label: stringGetter({ key: STRING_KEYS.TOTAL }),
          allowsSorting: false,

          renderCell: ({ affiliateEarnings, affiliateReferredUsers }) => (
            <TableCell>
              <div tw="w-full">
                <$EarningsOutput
                  type={OutputType.CompactFiat}
                  value={affiliateEarnings}
                  slotRight={
                    <span tw="ml-0.25 text-color-text-2">
                      {stringGetter({ key: STRING_KEYS.EARNINGS }).toLocaleLowerCase()}
                    </span>
                  }
                />
              </div>
              <div tw="w-full text-color-text-0">
                {affiliateReferredUsers.toLocaleString()}{' '}
                {stringGetter({ key: STRING_KEYS.USERS_REFERRED })}
              </div>
            </TableCell>
          ),
        },
      ]
    : [
        {
          columnKey: 'rank',
          label: stringGetter({ key: STRING_KEYS.RANK }),
          allowsSorting: false,
          renderCell: ({ rank, affiliateAddress }) => (
            <TableCell tw="text-color-text-1 font-base-medium">
              {rank}
              {affiliateAddress && affiliateAddress === dydxAddress && (
                <Tag tw="bg-color-accent">{stringGetter({ key: STRING_KEYS.YOU })}</Tag>
              )}
            </TableCell>
          ),
        },
        {
          columnKey: 'account',
          label: stringGetter({ key: STRING_KEYS.ACCOUNT }),
          allowsSorting: false,

          renderCell: ({ affiliateReferralCode }) => (
            <$AccountOutput type={OutputType.Text} value={affiliateReferralCode} />
          ),
        },
        {
          columnKey: 'total-earnings',
          label: stringGetter({ key: STRING_KEYS.TOTAL_EARNINGS }),
          allowsSorting: false,

          renderCell: ({ affiliateEarnings }) => (
            <$EarningsOutput type={OutputType.CompactFiat} value={affiliateEarnings} />
          ),
        },
        {
          columnKey: 'ref-vol',
          label: stringGetter({ key: STRING_KEYS.VOLUME_REFERRED }),
          allowsSorting: false,

          renderCell: ({ affiliateReferredTotalVolume }) => (
            <$NumberOutput type={OutputType.CompactFiat} value={affiliateReferredTotalVolume} />
          ),
        } as ColumnDef<IAffiliateStats>,

        {
          columnKey: 'ref-fees',
          label: stringGetter({ key: STRING_KEYS.FEES_REFERRED }),
          allowsSorting: false,
          renderCell: ({ affiliateTotalReferredFees }) => (
            <$NumberOutput type={OutputType.CompactFiat} value={affiliateTotalReferredFees} />
          ),
        } as ColumnDef<IAffiliateStats>,

        {
          columnKey: 'total-referred-users',
          label: stringGetter({ key: STRING_KEYS.USERS_REFERRED }),
          allowsSorting: false,
          renderCell: ({ affiliateReferredUsers }) => (
            <$NumberOutput type={OutputType.Number} value={affiliateReferredUsers} />
          ),
        },
      ];

  const setFilter = (newFilter: AffiliateEpochsFilter) => {
    setEpochFilter(newFilter);
  };

  return (
    <div tw="flex flex-col gap-1 px-1">
      <div tw="flex flex-col gap-0.5">
        <ContentSectionHeader
          tw="p-0"
          title={stringGetter({ key: STRING_KEYS.AFFILIATES_LEADERBOARD })}
        />
        <AffiliatesFilter
          compactLayout
          selectedFilter={epochFilter}
          filters={affiliatesFilters}
          onChangeFilter={setFilter}
        />
        <$Table
          withInnerBorders
          data={affiliates ?? EMPTY_ARR}
          tableId="affiliate-leaderboard"
          getRowKey={(row: IAffiliateLeaderboardStats) => row.rank}
          label={stringGetter({ key: STRING_KEYS.AFFILIATES_LEADERBOARD })}
          columns={columns}
          paginationBehavior="showAll"
        />
      </div>
    </div>
  );
};

const $Table = styled(Table)<AllTableProps<any>>`
  ${tradeViewMixins.horizontalTable}

  th {
    background: var(--color-layer-2);
  }
`;

const $AccountOutput = tw(Output)`font-base-medium text-color-text-1`;

const $NumberOutput = tw(Output)`font-base-medium text-color-text-1`;

const $EarningsOutput = styled(Output)`
  color: var(--color-positive);
  font: var(--font-base-medium);
`;

const $AffiliatesFilter = styled.div<{ $compactLayout: boolean }>`
  display: none; // Update this to flex once there is more than 1 filter
  flex-direction: ${({ $compactLayout }) => ($compactLayout ? 'row' : 'column')};
  justify-content: space-between;
  gap: 0.75rem;
  flex: 1;
  overflow: hidden;
  padding: 0;
  ${({ $compactLayout }) =>
    $compactLayout &&
    css`
      @media ${breakpoints.mobile} {
        flex-direction: column;
      }
    `};
`;

const $ToggleGroupContainer = styled.div<{ $compactLayout: boolean }>`
  ${layoutMixins.row}
  justify-content: space-between;
  overflow-x: hidden;
  position: relative;
  --toggle-group-paddingRight: 0.75rem;

  &:after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: var(--toggle-group-paddingRight);
    background: linear-gradient(to right, transparent 10%, var(--color-layer-2));
  }

  ${({ $compactLayout }) =>
    $compactLayout &&
    css`
      & button {
        --button-toggle-off-backgroundColor: ${({ theme }) => theme.toggleBackground};
        --button-toggle-off-textColor: ${({ theme }) => theme.textSecondary};
        --border-color: ${({ theme }) => theme.layer6};
        --button-height: 2rem;
        --button-padding: 0 0.625rem;
        --button-font: var(--font-small-book);
      }
    `}
`;

const $ToggleGroup = styled(ToggleGroup)`
  overflow-x: auto;
  padding-right: var(--toggle-group-paddingRight);
` as typeof ToggleGroup;
