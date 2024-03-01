import styled, { type AnyStyledComponent, css } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import type { ColumnSize } from '@react-types/table';

import { type SubaccountTransfer } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { useBreakpoints, useStringGetter, useURLConfigs } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Icon } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Table, TableCell, TableColumnHeader, type ColumnDef } from '@/components/Table';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getSubaccountTransfers } from '@/state/accountSelectors';
import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { openDialog } from '@/state/dialogs';

import { truncateAddress } from '@/lib/wallet';

const MOBILE_TRANSFERS_PER_PAGE = 50;

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
  isTablet?: boolean;
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
          <Styled.TimeOutput
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
            <Styled.TxHash
              withIcon
              href={`${mintscanTxUrl?.replace('{tx_hash}', transactionHash)}`}
            >
              {truncateAddress(transactionHash, '')}
            </Styled.TxHash>
          ) : (
            '-'
          ),
      },
    } as Record<TransferHistoryTableColumnKey, ColumnDef<SubaccountTransfer>>
  )[key],
});

type ElementProps = {
  columnKeys?: TransferHistoryTableColumnKey[];
  columnWidths?: Partial<Record<TransferHistoryTableColumnKey, ColumnSize>>;
};

type StyleProps = {
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
};

export const TransferHistoryTable = ({
  columnKeys = Object.values(TransferHistoryTableColumnKey),
  columnWidths,
  withOuterBorder,
  withInnerBorders = true,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { isMobile, isTablet } = useBreakpoints();
  const { mintscan: mintscanTxUrl } = useURLConfigs();

  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);

  const transfers = useSelector(getSubaccountTransfers, shallowEqual) ?? [];

  return (
    <Styled.Table
      label="Transfers"
      data={isMobile ? transfers.slice(0, MOBILE_TRANSFERS_PER_PAGE) : transfers}
      getRowKey={(row: SubaccountTransfer) => row.id}
      columns={columnKeys.map((key: TransferHistoryTableColumnKey) =>
        getTransferHistoryTableColumnDef({
          key,
          isTablet,
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
      selectionBehavior="replace"
      withOuterBorder={withOuterBorder}
      withInnerBorders={withInnerBorders}
      withScrollSnapColumns
      withScrollSnapRows
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.Icon = styled(Icon)`
  font-size: 3em;
`;

Styled.TimeOutput = styled(Output)`
  color: var(--color-text-0);
`;

Styled.TxHash = styled(Link)`
  justify-content: flex-end;
`;
