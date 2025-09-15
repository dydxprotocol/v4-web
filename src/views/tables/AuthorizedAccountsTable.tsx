import { useEffect, useMemo, useState } from 'react';

import { getLazyTradingKeyUtils } from '@/bonsai/lib/lazyDynamicLibs';
import { BonsaiHooks } from '@/bonsai/ontology';
import { type tradingKeyUtils } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonStyle,
  ButtonType,
} from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Table, type ColumnDef } from '@/components/Table';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { TableCell } from '@/components/Table/TableCell';

import { runFn } from '@/lib/do';

export type AuthorizedAccountInfo = ReturnType<
  (typeof tradingKeyUtils)['getAuthorizedTradingKeysMetadata']
>[number];

export const AuthorizedAccountsTable = ({
  className,
  onRemoveKey,
}: {
  className?: string;
  onRemoveKey: (info: AuthorizedAccountInfo) => void;
}) => {
  const stringGetter = useStringGetter();
  const authorizedAccountsRaw = BonsaiHooks.useAuthorizedAccounts().data;
  const [authorizedAccounts, setAuthorizedAccounts] = useState<AuthorizedAccountInfo[]>([]);

  useEffect(() => {
    let dead = false;
    runFn(async () => {
      const newVal = (await getLazyTradingKeyUtils()).getAuthorizedTradingKeysMetadata(
        authorizedAccountsRaw ?? []
      );
      if (!dead) {
        setAuthorizedAccounts(newVal);
      }
    });
    return () => {
      dead = true;
    };
  }, [authorizedAccountsRaw]);

  const columns = useMemo<ColumnDef<AuthorizedAccountInfo>[]>(
    () => [
      {
        columnKey: 'address',
        getCellValue: (row) => row.address,
        label: 'API Wallet Address',
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
              Remove
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
      label="Authorized Accounts"
      slotEmpty={<div>No authorized accounts</div>}
      columns={columns}
      className={className}
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  --tableStickyRow-backgroundColor: var(--color-layer-3);
  --tableRow-backgroundColor: var(--color-layer-3);
  --computed-radius: 1rem;

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }
  }
` as typeof Table;
