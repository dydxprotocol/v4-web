import { useMemo, useState } from 'react';

import { VaultTransfer, VaultTransferType } from '@/bonsai/public-calculators/vaultAccount';
import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';
import { useLoadedVaultAccountTransfers } from '@/hooks/vaultsHooks';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';

import { isTruthy } from '@/lib/isTruthy';
import { truncateAddress } from '@/lib/wallet';

export const VaultTransactionsCard = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const [showHistory, setShowHistory] = useState(false);
  const transactions = useLoadedVaultAccountTransfers() ?? EMPTY_ARR;

  return (
    <div className={className} tw="rounded-[0.7rem] border border-solid border-color-border">
      {transactions.length > 0 ? (
        <>
          <div tw="flex justify-between px-1 py-0.625">
            <h3 tw="leading-7">
              {stringGetter({ key: STRING_KEYS.YOUR_MEGAVAULT_HISTORY })}
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
            <Icon iconName={IconName.OrderPending} size="2rem" tw="mb-0.75" />
          </div>
          <div>{stringGetter({ key: STRING_KEYS.YOU_HAVE_NO_VAULT_BALANCE })}</div>
        </div>
      )}
    </div>
  );
};

const $ShowHideHistoryButton = styled(Button)``;

export const VaultTransactionsTable = ({
  className,
  withOuterBorders,
  emptyString,
  withTxHashLink,
}: {
  className?: string;
  withOuterBorders?: boolean;
  emptyString?: string;
  withTxHashLink?: boolean;
}) => {
  const stringGetter = useStringGetter();
  const transactions = useLoadedVaultAccountTransfers() ?? EMPTY_ARR;
  const { mintscan: mintscanTxUrl } = useURLConfigs();

  const columns = useMemo<ColumnDef<VaultTransfer>[]>(
    () =>
      (
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
                  title=""
                />
                <div tw="text-[0.75rem] leading-[0.7rem] text-color-text-0">
                  <Output value={timestampMs} type={OutputType.Time} timeOptions={{}} title="" />
                </div>
              </div>
            ),
          },
          {
            columnKey: 'action',
            getCellValue: (row) => row.type,
            label: stringGetter({ key: STRING_KEYS.ACTION }),
            renderCell: ({ type }) => (
              <Output
                value={
                  type === VaultTransferType.DEPOSIT
                    ? stringGetter({ key: STRING_KEYS.ADD_FUNDS })
                    : type === VaultTransferType.WITHDRAWAL
                      ? stringGetter({ key: STRING_KEYS.REMOVE_FUNDS })
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
          withTxHashLink && {
            columnKey: 'tx-hash',
            getCellValue: (row) => row.transactionHash,
            label: stringGetter({ key: STRING_KEYS.TRANSACTION }),
            renderCell: ({ transactionHash }) =>
              transactionHash ? (
                <Link
                  withIcon
                  href={`${mintscanTxUrl.replace('{tx_hash}', transactionHash)}`}
                  tw="justify-end"
                >
                  {truncateAddress(transactionHash, '')}
                </Link>
              ) : (
                '-'
              ),
          },
        ] satisfies Array<ColumnDef<VaultTransfer> | false | undefined>
      ).filter(isTruthy),
    [mintscanTxUrl, stringGetter, withTxHashLink]
  );
  return (
    <$Table
      withInnerBorders
      data={transactions}
      tableId="vault-transactions"
      getRowKey={(row) => row.id ?? ''}
      label={stringGetter({ key: STRING_KEYS.MEGAVAULT })}
      defaultSortDescriptor={{
        column: 'time',
        direction: 'descending',
      }}
      columns={columns}
      className={className}
      withOuterBorder={transactions.length === 0 || withOuterBorders}
      slotEmpty={emptyString}
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
  min-width: auto;
` as typeof Table;
