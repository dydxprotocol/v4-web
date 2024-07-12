import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';

import { useAppSelector } from '@/state/appTypes';
import { getUserVault } from '@/state/vaultSelectors';
import { VaultTransaction } from '@/state/vaults';

export const VaultTransactionsCard = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const [showHistory, setShowHistory] = useState(false);
  const transactions = useAppSelector(getUserVault)?.transactionHistory ?? EMPTY_ARR;

  return (
    <$HistoryCard className={className}>
      {transactions.length > 0 ? (
        <>
          <$HistoryTitle>
            <$HistoryTitleText>
              {stringGetter({ key: STRING_KEYS.YOUR_DEPOSITS_AND_WITHDRAWALS })}
              <$HistoryCount>{transactions.length}</$HistoryCount>
            </$HistoryTitleText>
            <$ShowHideHistoryButton
              size={ButtonSize.XSmall}
              shape={ButtonShape.Pill}
              onClick={() => setShowHistory((o) => !o)}
            >
              {showHistory
                ? stringGetter({ key: STRING_KEYS.HIDE })
                : stringGetter({ key: STRING_KEYS.VIEW })}
            </$ShowHideHistoryButton>
          </$HistoryTitle>
          {showHistory && <VaultTransactionsTable />}
        </>
      ) : (
        <$Empty>
          <div>
            <$Icon iconName={IconName.OrderPending} />
          </div>
          <div>{stringGetter({ key: STRING_KEYS.YOU_HAVE_NO_VAULT_DEPOSITS })}</div>
        </$Empty>
      )}
    </$HistoryCard>
  );
};

const $Empty = styled.div`
  ${layoutMixins.column}
  padding: 1rem;
  color: var(--color-text-0);
  justify-items: center;
  align-content: center;
`;

const $Icon = styled(Icon)`
  width: 2rem;
  height: 2rem;
  margin-bottom: 0.75rem;
`;
const $HistoryCard = styled.div`
  border-radius: 0.7rem;
  border: 1px solid var(--color-border);
`;
const $HistoryCount = styled.span`
  margin-left: 0.5rem;
  color: var(--color-text-0);
`;
const $ShowHideHistoryButton = styled(Button)``;

const $HistoryTitle = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.625rem 1rem;
`;
const $HistoryTitleText = styled.h3`
  font: var(--font-base-medium);
  line-height: 1.75rem;
`;

const VaultTransactionsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const transactions = useAppSelector(getUserVault)?.transactionHistory ?? EMPTY_ARR;

  const columns = useMemo<ColumnDef<VaultTransaction>[]>(
    () =>
      [
        {
          columnKey: 'time',
          getCellValue: (row) => row.timestampMs,
          label: stringGetter({ key: STRING_KEYS.TIME }),
          renderCell: ({ timestampMs }) => (
            <$Stack>
              <Output
                value={timestampMs}
                type={OutputType.Date}
                dateOptions={{ format: 'medium' }}
              />
              <$TimeText>
                <Output value={timestampMs} type={OutputType.Time} timeOptions={{}} />
              </$TimeText>
            </$Stack>
          ),
        },
        {
          columnKey: 'action',
          getCellValue: (row) => row.type,
          label: stringGetter({ key: STRING_KEYS.ACTION }),
          renderCell: ({ type }) => (
            <Output
              value={
                type === 'deposit'
                  ? stringGetter({ key: STRING_KEYS.DEPOSIT })
                  : stringGetter({ key: STRING_KEYS.WITHDRAW })
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
      ] satisfies ColumnDef<VaultTransaction>[],
    [stringGetter]
  );
  return (
    <$Table
      withInnerBorders
      data={transactions}
      getRowKey={(row) => row.id}
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

const $Stack = styled.div`
  ${layoutMixins.column}
`;

const $TimeText = styled.div`
  font-size: 0.75rem;
  line-height: 0.7rem;
  color: var(--color-text-0);
`;
