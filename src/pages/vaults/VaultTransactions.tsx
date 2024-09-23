import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { VaultTransfer } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';

import { useAppSelector } from '@/state/appTypes';
import { useLoadedVaultAccountTransfers } from '@/state/vaultsLifecycle';

export const VaultTransactionsCard = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const [showHistory, setShowHistory] = useState(false);
  const transactions = useLoadedVaultAccountTransfers() ?? EMPTY_ARR;

  return (
    <div className={className} tw="rounded-[0.7rem] border border-solid border-color-border">
      {transactions.length > 0 ? (
        <>
          <div tw="flex justify-between px-1 py-0.625">
            <h3 tw="leading-7 font-base-medium">
              {stringGetter({ key: STRING_KEYS.YOUR_DEPOSITS_AND_WITHDRAWALS })}
              <span tw="ml-0.5 text-color-text-0">{transactions.length}</span>
            </h3>
            <$ShowHideHistoryButton
              size={ButtonSize.XSmall}
              shape={ButtonShape.Pill}
              onClick={() => setShowHistory((o) => !o)}
            >
              {showHistory
                ? stringGetter({ key: STRING_KEYS.HIDE })
                : stringGetter({ key: STRING_KEYS.VIEW })}
            </$ShowHideHistoryButton>
          </div>
          {showHistory && <VaultTransactionsTable />}
        </>
      ) : (
        <div tw="column content-center justify-items-center p-1 text-color-text-0">
          <div>
            <Icon iconName={IconName.OrderPending} tw="mb-0.75 h-2 w-2" />
          </div>
          <div>{stringGetter({ key: STRING_KEYS.YOU_HAVE_NO_VAULT_DEPOSITS })}</div>
        </div>
      )}
    </div>
  );
};
const $ShowHideHistoryButton = styled(Button)``;
const VaultTransactionsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const transactions = useAppSelector(useLoadedVaultAccountTransfers) ?? EMPTY_ARR;

  const columns = useMemo<ColumnDef<VaultTransfer>[]>(
    () =>
      [
        {
          columnKey: 'time',
          getCellValue: (row) => row.timestampMs,
          label: stringGetter({ key: STRING_KEYS.TIME }),
          renderCell: ({ timestampMs }) => (
            <div tw="column">
              <Output
                value={timestampMs}
                type={OutputType.Date}
                dateOptions={{ format: 'medium' }}
              />
              <div tw="text-[0.75rem] leading-[0.7rem] text-color-text-0">
                <Output value={timestampMs} type={OutputType.Time} timeOptions={{}} />
              </div>
            </div>
          ),
        },
        {
          columnKey: 'action',
          getCellValue: (row) => row.type?.name,
          label: stringGetter({ key: STRING_KEYS.ACTION }),
          renderCell: ({ type }) => (
            <Output
              value={
                type?.name === 'DEPOSIT'
                  ? stringGetter({ key: STRING_KEYS.DEPOSIT })
                  : type?.name === 'WITHDRAWAL'
                    ? stringGetter({ key: STRING_KEYS.WITHDRAW })
                    : undefined
              }
              type={OutputType.Text}
            />
          ),
        },
        {
          columnKey: 'amount',
          getCellValue: (row) => row.amountUsdc,
          label: stringGetter({ key: STRING_KEYS.AMOUNT }),
          renderCell: ({ amountUsdc }) => <Output value={amountUsdc} type={OutputType.Fiat} />,
        },
      ] satisfies ColumnDef<VaultTransfer>[],
    [stringGetter]
  );
  return (
    <$Table
      withInnerBorders
      data={transactions}
      getRowKey={(row) => row.id ?? ''}
      label={stringGetter({ key: STRING_KEYS.VAULT })}
      defaultSortDescriptor={{
        column: 'time',
        direction: 'descending',
      }}
      columns={columns}
      className={className}
      withOuterBorder={transactions.length === 0}
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
` as typeof Table;
