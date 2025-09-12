import { useMemo } from 'react';

import { BonsaiHooks } from '@/bonsai/ontology';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { AccountAuthenticator } from '@/constants/validators';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Table, type ColumnDef } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';

type AuthorizedAccountTableRow = AccountAuthenticator;

export const AuthorizedAccountsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const authorizedAccounts = BonsaiHooks.useAuthorizedAccounts();

  const columns = useMemo<ColumnDef<AuthorizedAccountTableRow>[]>(
    () => [
      {
        columnKey: 'id',
        getCellValue: (row) => row.id.toString(),
        label: stringGetter({ key: STRING_KEYS.ADDRESS }),
        renderCell: ({ id }) => <TableCell>{id.toString()}</TableCell>,
      },
      {
        columnKey: 'type',
        getCellValue: (row) => row.type,
        label: 'type',
        renderCell: ({ type }) => <TableCell>{type}</TableCell>,
      },
      {
        columnKey: 'config',
        getCellValue: (row) => row.type,
        label: 'config',
        renderCell: ({ config }) => <TableCell>{config}</TableCell>,
      },
    ],
    [stringGetter]
  );

  return (
    <$Table
      withInnerBorders
      withOuterBorder
      data={authorizedAccounts.data ?? EMPTY_ARR}
      tableId="authorized-accounts"
      getRowKey={(row) => row.id.toString()}
      label="Authorized Accounts"
      slotEmpty={<div>No authorized accounts</div>}
      defaultSortDescriptor={{
        column: 'margin',
        direction: 'descending',
      }}
      columns={columns}
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
