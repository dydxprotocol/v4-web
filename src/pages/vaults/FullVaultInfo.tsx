import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { HorizontalSeparatorFiller } from '@/components/Separator';
import { ColumnDef, Table } from '@/components/Table';

import { useAppSelector } from '@/state/appTypes';
import { getUserVault, getVaultDetails } from '@/state/vaultSelectors';
import { VaultTransaction } from '@/state/vaults';

import { getNumberSign } from '@/lib/numbers';

import { VaultsTable } from './VaultsTable';

type MyVaultDetailsCardsProps = {
  className?: string;
};

const YourVaultDetailsCards = ({ className }: MyVaultDetailsCardsProps) => {
  const myVaultMetadata = useAppSelector(getUserVault);
  const items = [
    {
      key: 'balance',
      label: 'Your Vault Balance',
      value:
        myVaultMetadata == null ? (
          '-'
        ) : (
          <Output value={myVaultMetadata?.userBalance} type={OutputType.CompactFiat} />
        ),
    },
    {
      key: 'pnl',
      label: 'Your All-time P&L',
      value:
        myVaultMetadata == null ? (
          '-'
        ) : (
          <$ColoredReturn $sign={getNumberSign(myVaultMetadata?.userReturn)}>
            <Output value={myVaultMetadata?.userReturn} type={OutputType.CompactFiat} />
          </$ColoredReturn>
        ),
    },
  ];
  return (
    <$CardsContainer className={className}>
      {items.map((item) => (
        <$DetailCard key={item.key}>
          <$CardHeader>{item.label}</$CardHeader>
          <$CardValue>{item.value}</$CardValue>
        </$DetailCard>
      ))}
    </$CardsContainer>
  );
};

const $CardsContainer = styled.div`
  ${layoutMixins.gridEqualColumns}
  flex-direction: row;
  gap: 0.5rem;
`;
const $DetailCard = styled.div`
  border: solid var(--border-width) var(--border-color);
  border-radius: 0.7rem;
  padding: 0.5rem 0.75rem;
  font: var(--font-small-book);

  ${layoutMixins.column};
`;
const $CardHeader = styled.div`
  color: var(--color-text-0);
`;
const $CardValue = styled.div``;

export const useVaultDetailsItems = () => {
  const stringGetter = useStringGetter();
  const { allTimePnl, thirtyDayReturnPercent, totalValue } = useAppSelector(getVaultDetails) ?? {};

  const items = [
    {
      key: 'balance',
      label: stringGetter({ key: STRING_KEYS.VAULT_BALANCE }),
      value: <Output value={totalValue} type={OutputType.CompactFiat} />,
    },
    {
      key: 'all-time-pnl',
      label: stringGetter({ key: STRING_KEYS.VAULT_ALL_TIME_PNL }),
      value: (
        <$ColoredReturn $sign={getNumberSign(allTimePnl?.absolute)}>
          {allTimePnl?.absolute != null ? (
            <Output value={allTimePnl?.absolute} type={OutputType.CompactFiat} />
          ) : (
            '-'
          )}{' '}
          <Output value={allTimePnl?.percent} type={OutputType.Percent} withParentheses />
        </$ColoredReturn>
      ),
    },
    {
      key: '30d-apr',
      label: stringGetter({ key: STRING_KEYS.VAULT_THIRTY_DAY_APR }),
      value: <Output value={thirtyDayReturnPercent} type={OutputType.Percent} />,
    },
  ];
  return items;
};

const $ColoredReturn = styled.div<{ $sign: NumberSign }>`
  display: flex;
  gap: 0.25rem;
  ${({ $sign }) =>
    $sign &&
    {
      [NumberSign.Positive]: css`
        color: var(--color-positive);
      `,
      [NumberSign.Negative]: css`
        color: var(--color-negative);
      `,
      [NumberSign.Neutral]: null,
    }[$sign]}
`;

type FullVaultInfoProps = { className?: string };

export const FullVaultInfo = ({ className }: FullVaultInfoProps) => {
  const stringGetter = useStringGetter();

  const detailItems = useVaultDetailsItems();
  return (
    <$Container className={className}>
      <$HeaderRow>
        <$MarketTitle>
          <AssetIcon symbol="BTC" />
          {stringGetter({ key: STRING_KEYS.ASSET_VAULT, params: { ASSET: 'BTC' } })}
        </$MarketTitle>
        <$YourVaultDetailsCards />
      </$HeaderRow>
      <$DetailsRow>
        {detailItems
          .filter((i) => i.key !== 'balance')
          .map((item) => (
            <$DetailItem key={item.key}>
              <$DetailLabel>{item.label}</$DetailLabel>
              <$DetailValue>{item.value}</$DetailValue>
            </$DetailItem>
          ))}
      </$DetailsRow>
      <$HorizontalSeparatorFiller />
      <$PnlRow />
      <$HorizontalSeparatorFiller />
      <$VaultsTable />
    </$Container>
  );
};

const $Container = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
`;
const $HeaderRow = styled.div`
  ${layoutMixins.flexEqualRow}
  justify-content: space-between;
`;
const $MarketTitle = styled.h3`
  ${layoutMixins.row}
  font: var(--font-large-medium);
  gap: 1.25rem;

  img {
    width: 2.25rem;
    height: 2.25rem;
  }
`;
const $YourVaultDetailsCards = styled(YourVaultDetailsCards)`
  min-width: min-content;
`;

const $HorizontalSeparatorFiller = styled(HorizontalSeparatorFiller)`
  display: flex;
  min-height: 1px;
`;

const $DetailsRow = styled.div`
  ${layoutMixins.flexWrap}
  gap: 2rem;
`;
const $DetailItem = styled.div`
  ${layoutMixins.flexColumn}
  font: var(--font-small-book);
  padding: 0 0.5rem;
`;
const $DetailLabel = styled.div`
  color: var(--color-text-0);
`;
const $DetailValue = styled.div``;

const $PnlRow = styled.div``;

const $VaultsTable = styled(VaultsTable)``;

type VaultTransactionsTableProps = { className?: string };

export const VaultTransactionsTable = ({ className }: VaultTransactionsTableProps) => {
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
            <Output value={timestampMs} type={OutputType.Date} dateOptions={{ format: 'medium' }} />
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
      label={stringGetter({ key: STRING_KEYS.VAULTS })}
      defaultSortDescriptor={{
        column: 'time',
        direction: 'descending',
      }}
      columns={columns}
      className={className}
      withOuterBorder={transactions.length === 0}
      slotEmpty={
        <$Empty>
          <div>
            <$Icon iconName={IconName.OrderPending} />
          </div>
          <div>You have no history.</div>
        </$Empty>
      }
    />
  );
};

const $Empty = styled.div`
  ${layoutMixins.column}
  justify-items: center;
  align-content: center;
`;

const $Icon = styled(Icon)`
  width: 2rem;
  height: 2rem;
  margin-bottom: 0.75rem;
`;

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
` as typeof Table;
