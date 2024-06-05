import type { ColumnSize } from '@react-types/table';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { type SubaccountTransfer } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountTransfers } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { truncateAddress } from '@/lib/wallet';

export enum TransferHistoryTableColumnKey {
  Time = 'Time',
  Action = 'Action',
  SenderRecipient = 'Sender-Recipient',
  Amount = 'Amount',
  TxHash = 'TxHash',
}

const getTransferHistoryTableColumnDef = ({
  key,
  stringGetter,
  width,
  mintscanTxUrl,
}: {
  key: TransferHistoryTableColumnKey;
  stringGetter: StringGetterFunction;
  width?: ColumnSize;
  mintscanTxUrl?: string;
}): ColumnDef<SubaccountTransfer> => ({
  width,
  ...(
    {
      [TransferHistoryTableColumnKey.Time]: {
        columnKey: TransferHistoryTableColumnKey.Time,
        getCellValue: (row) => row.updatedAtMilliseconds,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        renderCell: ({ updatedAtMilliseconds }) => (
          <$TimeOutput
            type={OutputType.RelativeTime}
            relativeTimeFormatOptions={{ format: 'singleCharacter' }}
            value={updatedAtMilliseconds}
          />
        ),
      },
      [TransferHistoryTableColumnKey.Action]: {
        columnKey: TransferHistoryTableColumnKey.Action,
        getCellValue: (row) => row.resources.typeStringKey,
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        renderCell: ({ resources }) =>
          resources.typeStringKey && stringGetter({ key: resources.typeStringKey }),
      },
      [TransferHistoryTableColumnKey.SenderRecipient]: {
        columnKey: TransferHistoryTableColumnKey.SenderRecipient,
        getCellValue: (row) => `${row.fromAddress}-${row.toAddress}`,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.TRANSFER_SENDER })}</span>
            <span>{stringGetter({ key: STRING_KEYS.TRANSFER_RECIPIENT })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ fromAddress, toAddress }) => (
          <TableCell stacked>
            <CopyButton buttonType="text" value={fromAddress ?? undefined}>
              {fromAddress ? truncateAddress(fromAddress) : '-'}
            </CopyButton>{' '}
            <CopyButton buttonType="text" value={toAddress ?? undefined}>
              {toAddress ? truncateAddress(toAddress) : '-'}
            </CopyButton>
          </TableCell>
        ),
      },
      [TransferHistoryTableColumnKey.Amount]: {
        columnKey: TransferHistoryTableColumnKey.Amount,
        getCellValue: (row) => row.amount,
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        renderCell: ({ amount }) => <Output type={OutputType.Fiat} value={amount} />,
      },
      [TransferHistoryTableColumnKey.TxHash]: {
        columnKey: TransferHistoryTableColumnKey.TxHash,
        getCellValue: (row) => row.transactionHash,
        label: stringGetter({ key: STRING_KEYS.TRANSACTION }),
        renderCell: ({ transactionHash }) =>
          transactionHash ? (
            <$TxHash withIcon href={`${mintscanTxUrl?.replace('{tx_hash}', transactionHash)}`}>
              {truncateAddress(transactionHash, '')}
            </$TxHash>
          ) : (
            '-'
          ),
      },
    } satisfies Record<TransferHistoryTableColumnKey, ColumnDef<SubaccountTransfer>>
  )[key],
});

type ElementProps = {
  columnKeys?: TransferHistoryTableColumnKey[];
  columnWidths?: Partial<Record<TransferHistoryTableColumnKey, ColumnSize>>;
  initialPageSize?: PageSize;
};

type StyleProps = {
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
};

export const TransferHistoryTable = ({
  columnKeys = Object.values(TransferHistoryTableColumnKey),
  columnWidths,
  initialPageSize,
  withOuterBorder,
  withInnerBorders = true,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { mintscan: mintscanTxUrl } = useURLConfigs();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);

  const transfers = useAppSelector(getSubaccountTransfers, shallowEqual) ?? [];

  return (
    <$Table
      label="Transfers"
      data={transfers}
      getRowKey={(row: SubaccountTransfer) => row.id}
      columns={columnKeys.map((key: TransferHistoryTableColumnKey) =>
        getTransferHistoryTableColumnDef({
          key,
          stringGetter,
          width: columnWidths?.[key],
          mintscanTxUrl,
        })
      )}
      slotEmpty={
        <>
          {stringGetter({ key: STRING_KEYS.TRANSFERS_EMPTY_STATE })}
          {canAccountTrade ? (
            <Button
              action={ButtonAction.Primary}
              onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
            >
              {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
            </Button>
          ) : (
            <OnboardingTriggerButton />
          )}
        </>
      }
      initialPageSize={initialPageSize}
      selectionBehavior="replace"
      withOuterBorder={withOuterBorder}
      withInnerBorders={withInnerBorders}
      withScrollSnapColumns
      withScrollSnapRows
    />
  );
};
const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
` as typeof Table;

const $TimeOutput = styled(Output)`
  color: var(--color-text-0);
`;

const $TxHash = styled(Link)`
  justify-content: flex-end;
`;
