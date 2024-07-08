import { Key, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Output, OutputType } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { AssetTableCell } from '@/components/Table/AssetTableCell';

import { useAppSelector } from '@/state/appTypes';
import { getVaultDetails } from '@/state/vaultSelectors';

type VaultTableRow = ReturnType<typeof getVaultDetails>['positions'][number];

export const VaultsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const vaultsData = useAppSelector(getVaultDetails)?.positions;

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
          getCellValue: (row) => row.marginUsdc,
          label: stringGetter({ key: STRING_KEYS.VAULT_BALANCE }),
          renderCell: ({ marginUsdc }) => <Output value={marginUsdc} type={OutputType.Fiat} />,
        },
      ] satisfies ColumnDef<VaultTableRow>[],
    [stringGetter]
  );

  return (
    <$Table
      withInnerBorders
      data={vaultsData}
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
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }
  }
` as typeof Table;
