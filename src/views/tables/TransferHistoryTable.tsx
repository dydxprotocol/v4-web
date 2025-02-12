import { BonsaiCore } from '@/bonsai/ontology';
import { SubaccountTransfer } from '@/bonsai/types/summaryTypes';
import type { ColumnSize } from '@react-types/table';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';

import { useStatsigGateValue } from '@/hooks/useStatsig';
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
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { MustNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';
import { truncateAddress } from '@/lib/wallet';

import { getTransferTypeStringKey } from './enumToStringKeyHelpers';

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
        getCellValue: (row) => row.createdAt,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        renderCell: ({ createdAt }) => (
          <Output
            type={OutputType.RelativeTime}
            relativeTimeOptions={{ format: 'singleCharacter' }}
            value={createdAt}
            tw="text-color-text-0"
          />
        ),
      },
      [TransferHistoryTableColumnKey.Action]: {
        columnKey: TransferHistoryTableColumnKey.Action,
        getCellValue: (row) => row.type,
        label: stringGetter({ key: STRING_KEYS.ACTION }),
        renderCell: ({ type }) => stringGetter({ key: getTransferTypeStringKey(type) }),
      },
      [TransferHistoryTableColumnKey.SenderRecipient]: {
        columnKey: TransferHistoryTableColumnKey.SenderRecipient,
        getCellValue: ({ sender: { address: fromAddress }, recipient: { address: toAddress } }) =>
          `${fromAddress}-${toAddress}`,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.TRANSFER_SENDER })}</span>
            <span>{stringGetter({ key: STRING_KEYS.TRANSFER_RECIPIENT })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ sender: { address: fromAddress }, recipient: { address: toAddress } }) => (
          <TableCell stacked>
            <CopyButton buttonType="text" value={fromAddress}>
              {fromAddress ? truncateAddress(fromAddress) : '-'}
            </CopyButton>{' '}
            <CopyButton buttonType="text" value={toAddress}>
              {toAddress ? truncateAddress(toAddress) : '-'}
            </CopyButton>
          </TableCell>
        ),
      },
      [TransferHistoryTableColumnKey.Amount]: {
        columnKey: TransferHistoryTableColumnKey.Amount,
        getCellValue: (row) => MustNumber(row.size),
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        renderCell: ({ size }) => <Output type={OutputType.Fiat} value={size} />,
      },
      [TransferHistoryTableColumnKey.TxHash]: {
        columnKey: TransferHistoryTableColumnKey.TxHash,
        getCellValue: (row) => row.transactionHash,
        label: stringGetter({ key: STRING_KEYS.TRANSACTION }),
        renderCell: ({ transactionHash }) =>
          transactionHash ? (
            <Link
              withIcon
              href={`${mintscanTxUrl?.replace('{tx_hash}', transactionHash)}`}
              tw="justify-end"
            >
              {truncateAddress(transactionHash, '')}
            </Link>
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
  const showNewDepositFlow =
    useStatsigGateValue(StatsigFlags.ffDepositRewrite) || testFlags.showNewDepositFlow;

  const transfers = useAppSelector(BonsaiCore.account.transfers.data);

  return (
    <$Table
      label="Transfers"
      data={transfers}
      tableId="transfer-history"
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
              onClick={() =>
                dispatch(
                  openDialog(
                    showNewDepositFlow ? DialogTypes.Deposit2({}) : DialogTypes.Deposit({})
                  )
                )
              }
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
