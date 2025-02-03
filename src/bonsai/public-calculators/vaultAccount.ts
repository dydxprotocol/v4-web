import { VaultModule } from '@dydxprotocol/v4-client-js';
import { orderBy, sumBy } from 'lodash';

import { IndexerTransferBetweenResponse, IndexerTransferType } from '@/types/indexer/indexerApiGen';

import { ToPrimitives } from '@/lib/abacus/parseToPrimitives';
import { MaybeNumber, MustBigNumber } from '@/lib/numbers';

export interface VaultAccount {
  balanceUsdc?: number;
  balanceShares?: number;
  lockedShares?: number;
  withdrawableUsdc?: number;
  allTimeReturnUsdc?: number;
  vaultTransfers?: VaultTransfer[];
  totalVaultTransfersCount?: number;
  vaultShareUnlocks?: VaultShareUnlock[];
  shareValue?: number;
}

export interface VaultTransfer {
  timestampMs?: number;
  amountUsdc?: number;
  type?: VaultTransferType;
  id?: string;
  transactionHash?: string;
}

export interface VaultShareUnlock {
  unlockBlockHeight?: number;
  amountUsdc?: number;
}

export enum VaultTransferType {
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
}

function calculateShareValue(balanceUsdc?: number, balanceShares?: number): number | undefined {
  if (balanceShares != null && balanceUsdc != null && balanceShares > 0) {
    return balanceUsdc / balanceShares;
  }
  return undefined;
}

export function calculateUserVaultInfo(
  vaultInfo: ToPrimitives<VaultModule.QueryMegavaultOwnerSharesResponse> | undefined,
  vaultTransfers: IndexerTransferBetweenResponse
): VaultAccount {
  const presentValue = (MaybeNumber(vaultInfo?.equity) ?? 0) / 1_000_000;
  const netTransfers = MaybeNumber(vaultTransfers.totalNetTransfers);
  const withdrawable = (MaybeNumber(vaultInfo?.withdrawableEquity) ?? 0) / 1_000_000;
  const allTimeReturn = netTransfers != null ? presentValue - netTransfers : undefined;
  const shareBalance = MaybeNumber(vaultInfo?.shares?.numShares) ?? 0;
  const impliedShareValue = shareBalance > 0 ? presentValue / shareBalance : 0;

  const vaultShareUnlocks = vaultInfo?.shareUnlocks.map((el) => ({
    unlockBlockHeight: MaybeNumber(el.unlockBlockHeight),
    amountUsdc:
      el.shares?.numShares != null
        ? MustBigNumber(el.shares.numShares).times(impliedShareValue).toNumber()
        : undefined,
  }));

  const transfers = vaultTransfers.transfersSubset.map((transfer) => ({
    timestampMs: new Date(transfer.createdAt).getTime(),
    amountUsdc: MaybeNumber(transfer.size),
    type: mapTransferType(transfer.type),
    id: transfer.id,
    transactionHash: transfer.transactionHash,
  }));

  return {
    balanceUsdc: presentValue,
    balanceShares: shareBalance,
    lockedShares: sumBy(
      vaultInfo?.shareUnlocks ?? [],
      (el) => MaybeNumber(el.shares?.numShares) ?? 0
    ),
    withdrawableUsdc: withdrawable,
    allTimeReturnUsdc: allTimeReturn,
    totalVaultTransfersCount: vaultTransfers.totalResults ?? undefined,
    vaultTransfers: transfers,
    vaultShareUnlocks: orderBy(vaultShareUnlocks, (o) => o.unlockBlockHeight, 'asc'),
    shareValue: calculateShareValue(presentValue, MaybeNumber(vaultInfo?.shares?.numShares)),
  };
}

function mapTransferType(type?: IndexerTransferType): VaultTransferType | undefined {
  switch (type) {
    case IndexerTransferType.TRANSFEROUT:
      return VaultTransferType.DEPOSIT;
    case IndexerTransferType.TRANSFERIN:
      return VaultTransferType.WITHDRAWAL;
    default:
      return undefined;
  }
}
