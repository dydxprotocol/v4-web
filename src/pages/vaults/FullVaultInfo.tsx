import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { HorizontalSeparatorFiller, VerticalSeparator } from '@/components/Separator';
import { ColumnDef, Table } from '@/components/Table';
import { Tag, TagSize, TagType } from '@/components/Tag';
import { PnlChart } from '@/views/charts/PnlChart';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getUserVault, getVaultDetails } from '@/state/vaultSelectors';
import { VaultTransaction } from '@/state/vaults';

import { getNumberSign } from '@/lib/numbers';

import { VaultsTable } from './VaultsTable';

type MyVaultDetailsCardsProps = {
  className?: string;
};

const EmptyValue = () => <$EmptyValue>—</$EmptyValue>;
const $EmptyValue = styled.span`
  color: var(--color-text-0);
`;
export const YourVaultDetailsCards = ({ className }: MyVaultDetailsCardsProps) => {
  const myVaultMetadata = useAppSelector(getUserVault);
  const items = [
    {
      key: 'balance',
      label: 'Your Vault Balance',
      value:
        myVaultMetadata == null || myVaultMetadata.userBalance === 0 ? (
          <EmptyValue />
        ) : (
          <Output value={myVaultMetadata?.userBalance} type={OutputType.Fiat} />
        ),
    },
    {
      key: 'pnl',
      label: 'Your All-time P&L',
      value:
        myVaultMetadata == null || myVaultMetadata?.userReturn.absolute === 0 ? (
          <EmptyValue />
        ) : (
          <$ColoredReturn $sign={getNumberSign(myVaultMetadata?.userReturn.absolute)}>
            <$OutputRow>
              <Output
                value={myVaultMetadata?.userReturn.absolute}
                type={OutputType.Fiat}
                fractionDigits={0}
              />
              <Output
                value={myVaultMetadata?.userReturn.percent}
                type={OutputType.Percent}
                withParentheses
              />
            </$OutputRow>
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
  gap: 1rem;
`;
const $DetailCard = styled.div`
  border: solid var(--border-width) var(--border-color);
  border-radius: 0.7rem;
  padding: 0.5rem 1rem;
  font: var(--font-base-book);

  ${layoutMixins.column};
`;
const $CardHeader = styled.div`
  color: var(--color-text-0);
`;
const $OutputRow = styled.div`
  ${layoutMixins.row}
  gap: .5rem;
`;
const $CardValue = styled.div`
  font: var(--font-medium-book);
  line-height: 1.2rem;
`;

export const useVaultDetailsItems = () => {
  const stringGetter = useStringGetter();
  const { thirtyDayReturnPercent, totalValue } = useAppSelector(getVaultDetails) ?? {};

  const items = [
    {
      key: '30d-apr',
      label: stringGetter({ key: STRING_KEYS.VAULT_THIRTY_DAY_APR }),
      value: (
        <$ColoredReturn $sign={getNumberSign(thirtyDayReturnPercent)}>
          <Output value={thirtyDayReturnPercent} type={OutputType.Percent} />
        </$ColoredReturn>
      ),
    },
    {
      key: 'balance',
      label: 'TVL',
      value: <Output value={totalValue} type={OutputType.Fiat} fractionDigits={0} />,
    },
  ];
  return items;
};

const $ColoredReturn = styled.div<{ $sign: NumberSign }>`
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
  const { vaultsLearnMore } = useURLConfigs();

  const detailItems = useVaultDetailsItems();
  const numPositions = useAppSelector(getVaultDetails)?.positions?.length ?? 0;
  const selectedLocale = useAppSelector(getSelectedLocale);
  return (
    <$Container className={className}>
      <$HeaderRow>
        <$MarketTitle>
          <$VaultImg src="/dydx-chain.png" />
          <div>
            <$MarketTitleText>{stringGetter({ key: STRING_KEYS.VAULT })}</$MarketTitleText>
            <$LearnMoreLink href={vaultsLearnMore} withIcon>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
            </$LearnMoreLink>
          </div>
        </$MarketTitle>
        {detailItems.map((item) => (
          <>
            <$VerticalSeparator />
            <$DetailItem key={item.key}>
              <$DetailLabel>{item.label}</$DetailLabel>
              <$DetailValue>{item.value}</$DetailValue>
            </$DetailItem>
          </>
        ))}
      </$HeaderRow>

      <$HorizontalSeparatorFiller />
      <$PnlRow>
        <$PnlChart selectedLocale={selectedLocale} />
      </$PnlRow>

      <$HorizontalSeparatorFiller />
      <div>
        <$SectionTitle>
          {stringGetter({ key: STRING_KEYS.OPEN_POSITIONS })}{' '}
          <Tag size={TagSize.Medium} type={TagType.Number}>
            {numPositions}
          </Tag>
        </$SectionTitle>
        <$VaultsTable />
      </div>
    </$Container>
  );
};

const $VerticalSeparator = styled(VerticalSeparator)`
  &&& {
    height: 2rem;
  }
`;
const $LearnMoreLink = styled(Link)`
  font: var(--font-small-book);
  color: var(--color-text-1);
`;
const $VaultImg = styled.img`
  width: 3.5rem;
  height: 3.5rem;
`;

const $SectionTitle = styled.div`
  font: var(--font-large-medium);
  margin-bottom: 1rem;
  ${layoutMixins.row}
  gap: 0.5rem;
`;

const $Container = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
`;

const $HeaderRow = styled.div`
  ${layoutMixins.flexWrap}
  gap: 1.5rem;
  margin-bottom: 0.625rem;
`;

const $MarketTitleText = styled.h3`
  font: var(--font-extra-medium);
  color: var(--color-text-2);
`;

const $MarketTitle = styled.div`
  ${layoutMixins.row}
  gap: 1.25rem;
`;

const $HorizontalSeparatorFiller = styled(HorizontalSeparatorFiller)`
  display: flex;
  min-height: 1px;
`;

const $DetailItem = styled.div`
  ${layoutMixins.flexColumn}
  font: var(--font-base-book);
  padding: 0 0.5rem;
  gap: 0.25rem;
`;
const $DetailLabel = styled.div`
  color: var(--color-text-0);
`;
const $DetailValue = styled.div`
  font: var(--font-medium-book);
`;

const $PnlRow = styled.div`
  height: 30rem;
`;
const $PnlChart = styled(PnlChart)`
  height: 30rem;
  background-color: var(--color-layer-2);

  // todo remember to grab colors
  --pnl-line-color: var(--color-positive);
`;

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
