import { useMemo } from 'react';

import { BonsaiHooks } from '@/bonsai/ontology';
import styled from 'styled-components';

import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonStyle,
  ButtonType,
} from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { AccountAuthenticator } from '@/constants/validators';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { defaultTableMixins } from '@/styles/tableMixins';

import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Table, type ColumnDef } from '@/components/Table';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { TableCell } from '@/components/Table/TableCell';

export type AuthorizedAccountInfo = AccountAuthenticator;

export const TradingKeysTable = ({
  className,
  onRemoveKey,
}: {
  className?: string;
  onRemoveKey: (info: AuthorizedAccountInfo) => void;
}) => {
  const stringGetter = useStringGetter();
  const authorizedAccounts = BonsaiHooks.useAuthorizedAccounts().data ?? EMPTY_ARR;

  const columns = useMemo<ColumnDef<AuthorizedAccountInfo>[]>(
    () => [
      {
        columnKey: 'address',
        getCellValue: (row) => row.address,
        label: stringGetter({ key: STRING_KEYS.API_WALLET_ADDRESS }),
        renderCell: ({ address }) => (
          <TableCell
            slotRight={
              <CopyButton
                buttonType="icon"
                value={address}
                shape={ButtonShape.Square}
                size={ButtonSize.XXSmall}
                buttonStyle={ButtonStyle.WithoutBackground}
                action={ButtonAction.Primary}
              />
            }
          >
            <span>{address}</span>
          </TableCell>
        ),
      },
      {
        columnKey: 'action',
        isActionable: true,
        allowsSorting: false,
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        renderCell: (row) => (
          <ActionsTableCell>
            <Button
              type={ButtonType.Reset}
              action={ButtonAction.Reset}
              shape={ButtonShape.Rectangle}
              size={ButtonSize.XSmall}
              onClick={() => onRemoveKey(row)}
            >
              {stringGetter({ key: STRING_KEYS.REMOVE })}
            </Button>
          </ActionsTableCell>
        ),
      },
    ],
    [onRemoveKey, stringGetter]
  );

  return (
    <$Table
      withInnerBorders
      withOuterBorder
      data={authorizedAccounts}
      tableId="authorized-accounts"
      getRowKey={(row) => row.id}
      label={stringGetter({ key: STRING_KEYS.API_TRADING_KEYS })}
      slotEmpty={<div>{stringGetter({ key: STRING_KEYS.NO_API_TRADING_KEYS_FOUND })}</div>}
      columns={columns}
      className={className}
    />
  );
};

const $Table = styled(Table)`
  ${defaultTableMixins}
  --tableStickyRow-backgroundColor: var(--color-layer-3);
  --tableRow-backgroundColor: var(--color-layer-3);
  --computed-radius: 1rem;

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }
  }
` as typeof Table;
