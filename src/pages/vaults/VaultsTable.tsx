import { Key, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Output, OutputType } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { AssetTableCell } from '@/components/Table/AssetTableCell';
import { Toolbar } from '@/components/Toolbar';

import { useAppSelector } from '@/state/appTypes';
import { getVaultsTableData } from '@/state/vaultSelectors';

import { matchesSearchFilter } from '@/lib/search';

import { VaultFilter, VaultsFilter } from './VaultFilter';

type VaultTableRow = ReturnType<typeof getVaultsTableData>[number];

export const VaultsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [filter, setFilter] = useState<VaultsFilter>(VaultsFilter.ALL);
  const navigate = useNavigate();

  const vaultsData = useAppSelector(getVaultsTableData);
  const filteredVaultsData = useMemo(() => {
    return vaultsData.filter(
      (vault) =>
        (filter === VaultsFilter.ALL ||
          (filter === VaultsFilter.MINE && (vault.userInfo?.userBalance ?? 0) > 0)) &&
        (searchFilter.trim().length === 0 ||
          matchesSearchFilter(searchFilter, vault.asset?.name) ||
          matchesSearchFilter(searchFilter, vault.asset?.id) ||
          matchesSearchFilter(searchFilter, vault.marketId))
    );
  }, [filter, searchFilter, vaultsData]);

  const columns = useMemo<ColumnDef<VaultTableRow>[]>(
    () =>
      [
        {
          columnKey: 'market',
          getCellValue: (row) => row.asset?.id,
          label: stringGetter({ key: STRING_KEYS.LP_VAULT }),
          renderCell: ({ asset }) => <AssetTableCell asset={asset} />,
        },
        {
          columnKey: 'vault-balance',
          getCellValue: (row) => row.vault.totalValue,
          label: stringGetter({ key: STRING_KEYS.VAULT_BALANCE }),
          renderCell: ({ vault }) => <Output value={vault?.totalValue} type={OutputType.Fiat} />,
        },
        {
          columnKey: 'your-balance',
          getCellValue: (row) => row.userInfo?.userBalance,
          label: stringGetter({ key: STRING_KEYS.YOUR_BALANCE }),
          renderCell: ({ userInfo }) => (
            <Output value={userInfo?.userBalance} type={OutputType.Fiat} />
          ),
        },
      ] satisfies ColumnDef<VaultTableRow>[],
    [stringGetter]
  );

  return (
    <>
      <$Toolbar>
        <VaultFilter
          onChangeFilter={setFilter}
          selectedFilter={filter}
          onSearchTextChange={setSearchFilter}
        />
      </$Toolbar>

      <$Table
        withInnerBorders
        data={filteredVaultsData}
        getRowKey={(row) => row.marketId}
        label={stringGetter({ key: STRING_KEYS.VAULTS })}
        onRowAction={(marketId: Key) =>
          navigate(`${AppRoute.Vaults}/${marketId}`, { state: { from: AppRoute.Vaults } })
        }
        defaultSortDescriptor={{
          column: 'vault-balance',
          direction: 'descending',
        }}
        columns={columns}
        paginationBehavior="showAll"
        className={className}
        slotEmpty={
          <$MarketNotFound>
            <div>
              <h2>
                {stringGetter({
                  key: STRING_KEYS.QUERY_NOT_FOUND,
                  params: {
                    QUERY:
                      searchFilter.trim().length > 0
                        ? searchFilter
                        : filter === VaultsFilter.MINE
                          ? stringGetter({ key: STRING_KEYS.MY_VAULTS })
                          : '',
                  },
                })}
              </h2>
              <p>{stringGetter({ key: STRING_KEYS.MARKET_SEARCH_DOES_NOT_EXIST_YET })}</p>
            </div>
          </$MarketNotFound>
        }
      />
    </>
  );
};
const $Toolbar = styled(Toolbar)`
  max-width: 100vw;
  overflow: hidden;
  margin-bottom: 0.625rem;
  padding-left: 0.375rem;
  padding-right: 0;

  @media ${breakpoints.desktopSmall} {
    padding-right: 0.375rem;
  }

  @media ${breakpoints.tablet} {
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }
  }
` as typeof Table;

const $MarketNotFound = styled.div`
  ${layoutMixins.column}
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2rem 1.5rem;

  h2 {
    font: var(--font-medium-medium);
  }
`;
