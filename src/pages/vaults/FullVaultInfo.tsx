import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { HorizontalSeparatorFiller } from '@/components/Separator';
import { ColumnDef, Table } from '@/components/Table';

import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';
import { getUserVaults, getVaultsDetails, getVaultsMetadata } from '@/state/vaultSelectors';
import { VaultTransaction } from '@/state/vaults';

import { getNumberSign } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

type MyVaultDetailsCardsProps = {
  vaultId: string;
  className?: string;
};

const YourVaultDetailsCards = ({ vaultId, className }: MyVaultDetailsCardsProps) => {
  const myVaultMetadata = useAppSelector(getUserVaults)?.[vaultId];
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

export const useVaultDetailsItems = (vaultId: string | null | undefined) => {
  const stringGetter = useStringGetter();
  const { configs, assetId } = useAppSelector(getPerpetualMarkets)?.[vaultId ?? ''] ?? {};
  const { allTimePnl, currentLeverageMultiple, thirtyDayReturnPercent, currentPosition } =
    useAppSelector(getVaultsDetails)[vaultId ?? ''] ?? {};
  const { totalValue } = useAppSelector(getVaultsMetadata)[vaultId ?? ''] ?? {};

  if (vaultId == null) {
    return [];
  }
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
    {
      key: 'vault-position',
      label: stringGetter({ key: STRING_KEYS.VAULT_POSITION }),
      value: (
        <$PositionContainer>
          <$ColoredReturn $sign={getNumberSign(currentPosition?.asset)}>
            <Output
              value={currentPosition?.asset}
              type={OutputType.Asset}
              tag={assetId}
              showSign={ShowSign.Negative}
              fractionDigits={configs?.stepSizeDecimals ?? TOKEN_DECIMALS}
            />
          </$ColoredReturn>
          <$MutedText>
            <Output
              value={currentPosition?.usdc}
              type={OutputType.Fiat}
              withParentheses
              fractionDigits={USD_DECIMALS}
            />
          </$MutedText>
        </$PositionContainer>
      ),
    },
    {
      key: 'vault-leverage',
      label: stringGetter({ key: STRING_KEYS.VAULT_LEVERAGE }),
      value: <Output value={currentLeverageMultiple} type={OutputType.Multiple} />,
    },
  ];
  return items;
};

const $PositionContainer = styled.div`
  display: flex;
  gap: 0.2rem;
`;
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
const $MutedText = styled.span`
  color: var(--color-text-0);
`;

type FullVaultInfoProps = {
  vaultId: string;
};

export const FullVaultInfo = ({ vaultId }: FullVaultInfoProps) => {
  const stringGetter = useStringGetter();
  const { assetId } = orEmptyObj(useAppSelector(getPerpetualMarkets)?.[vaultId ?? '']);
  const asset = useAppSelector(getAssets)?.[assetId ?? ''];

  const detailItems = useVaultDetailsItems(vaultId);
  return (
    <$Container>
      <$HeaderRow>
        <$MarketTitle>
          <AssetIcon symbol={assetId} />
          {stringGetter({ key: STRING_KEYS.ASSET_VAULT, params: { ASSET: asset?.name ?? '' } })}
        </$MarketTitle>
        <$YourVaultDetailsCards vaultId={vaultId} />
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
      <$HistoryRow>
        <$SectionTitle>{stringGetter({ key: STRING_KEYS.DEPOSITS_AND_WITHDRAWALS })}</$SectionTitle>
        <VaultTransactionsTable vaultId={vaultId} />
      </$HistoryRow>
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
const $HistoryRow = styled.div``;

const $SectionTitle = styled.div`
  font: var(--font-large-medium);
  margin-bottom: 1rem;
`;

type VaultTransactionsTableProps = { vaultId: string; className?: string };

export const VaultTransactionsTable = ({ vaultId, className }: VaultTransactionsTableProps) => {
  const stringGetter = useStringGetter();
  const transactions = useAppSelector(getUserVaults)?.[vaultId]?.transactionHistory ?? EMPTY_ARR;

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
