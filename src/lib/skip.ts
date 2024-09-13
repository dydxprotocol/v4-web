import {
  AxelarTransferInfoJSON,
  CCTPTransferInfoJSON,
  TrackTxResponseJSON,
  TransferEventJSON,
  TransferInfoJSON,
  TransferStatusJSON,
  TxStatusResponseJSON,
} from '@skip-router/core';

import {
  RouteStatus,
  SkipStatusResponse,
  SkipTransactionStatus,
  TransactionDataParams,
  TransferDirection,
} from '@/constants/skip';

import abacusStateManager from './abacus';
import { isTruthy } from './isTruthy';
import { sleep } from './timeUtils';

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const STATUS_ERROR_GRACE_PERIOD = 300_000;

type SkipStatusParams = {
  transactionHash: string;
  chainId: string | undefined;
  baseUrl: string | undefined;
};

const DEFAULT_SKIP_URL = 'https://api.skip.money';

export const trackSkipTx = async ({
  transactionHash,
  chainId,
  baseUrl,
}: SkipStatusParams): Promise<TrackTxResponseJSON> => {
  // We're not error handling here - a 404 still returns a json
  const response = await fetch(`${baseUrl ?? DEFAULT_SKIP_URL}/v2/tx/track`, {
    method: 'POST',
    body: JSON.stringify({
      chain_id: chainId,
      tx_hash: transactionHash,
    }),
  });
  return response.json();
};

export const MAX_TRACK_TX_ATTEMPTS = 5;
const TRACK_TX_INTERVAL = 1000;

export const trackSkipTxWithTenacity = async ({
  attemptNumber = 1,
  ...skipParams
}: SkipStatusParams & { attemptNumber?: number }) => {
  if (attemptNumber === MAX_TRACK_TX_ATTEMPTS) return;
  const { tx_hash: trackedTxHash } = await trackSkipTx(skipParams);
  if (!trackedTxHash) {
    sleep(TRACK_TX_INTERVAL);
    trackSkipTxWithTenacity({ ...skipParams, attemptNumber: attemptNumber + 1 });
  }
};

export const fetchSkipStatus = async ({ transactionHash, chainId, baseUrl }: SkipStatusParams) => {
  const response = await fetch(
    `${baseUrl ?? DEFAULT_SKIP_URL}/v2/tx/status?chain_id=${chainId}&tx_hash=${transactionHash}`
  );
  const statusResponse = await response.json();
  return formSkipStatusResponse(statusResponse);
};

const getTransferFromStatusResponse = (skipStatusResponse: TxStatusResponseJSON) => {
  return skipStatusResponse.transfers[0];
};

const getChainNameFromId = (chainId: string | undefined) => {
  if (!chainId) return undefined;
  const chain = abacusStateManager.getChainById(chainId);
  return chain?.chainName;
};

class TransactionData {
  routeStatus: RouteStatus;

  transactionStatus: SkipTransactionStatus;

  constructor({ chainId, txHash, status, txUrl, transferDirection }: TransactionDataParams) {
    this.routeStatus = {
      chainId,
      txHash,
      status: getStatusFromTransferState(status, transferDirection),
    };
    this.transactionStatus = {
      chainData: {
        chainId,
        chainName: getChainNameFromId(chainId),
        estimatedRouteDuration: '<30 minutes',
      },
      transactionId: txHash,
      transactionUrl: txUrl,
    };
  }
}

const getSquidStatusFromState = (state: string | undefined) => {
  if (!state) return undefined;
  if (state.includes('SUCCESS') || state.includes('RECEIVED')) return 'success';
  return 'ongoing';
};

const getStatusFromTransferState = (
  state: string | undefined,
  transferDirection: TransferDirection
) => {
  if (!state) return undefined;
  //        If state is not unknown, it means the FROM tx succeeded
  if (!state.includes('UNKNOWN') && transferDirection === 'from') return 'success';
  //        Both TO and FROM tx are successful when transfer has succeeded
  return getSquidStatusFromState(state);
};

const getTxDataFromIbcTransfer = (
  ibcTransfer: TransferInfoJSON,
  transferDirection: TransferDirection
) => {
  const txType = transferDirection === 'from' ? 'send_tx' : 'receive_tx';
  return new TransactionData({
    chainId:
      ibcTransfer.packet_txs[txType]?.chain_id ?? ibcTransfer[`${transferDirection}_chain_id`],
    txUrl: ibcTransfer.packet_txs[txType]?.explorer_link,
    txHash: ibcTransfer.packet_txs[txType]?.tx_hash,
    status: ibcTransfer.state,
    transferDirection,
  });
};

const getTxDataFromCCTPTransfer = (
  cctpTransfer: CCTPTransferInfoJSON,
  transferDirection: TransferDirection
) => {
  const txType = transferDirection === 'from' ? 'send_tx' : 'receive_tx';
  return new TransactionData({
    chainId: cctpTransfer.txs[txType]?.chain_id ?? cctpTransfer[`${transferDirection}_chain_id`],
    txUrl: cctpTransfer.txs[txType]?.explorer_link,
    txHash: cctpTransfer.txs[txType]?.tx_hash,
    status: cctpTransfer.state,
    transferDirection,
  });
};

const getTxDataFromAxelarTransfer = (
  axelarTransfer: AxelarTransferInfoJSON,
  transferDirection: TransferDirection
) => {
  const txType = transferDirection === 'from' ? 'send_tx' : 'execute_tx';
  if ('contract_call_with_token_txs' in axelarTransfer.txs) {
    return new TransactionData({
      chainId:
        axelarTransfer.txs.contract_call_with_token_txs[txType]?.chain_id ??
        axelarTransfer[`${transferDirection}_chain_id`],
      txUrl: axelarTransfer.txs.contract_call_with_token_txs[txType]?.explorer_link,
      txHash: axelarTransfer.txs.contract_call_with_token_txs[txType]?.tx_hash,
      status: axelarTransfer.state,
      transferDirection,
    });
  }
  return new TransactionData({
    chainId:
      axelarTransfer.txs.send_token_txs[txType]?.chain_id ??
      axelarTransfer[`${transferDirection}_chain_id`],
    txUrl: axelarTransfer.txs.send_token_txs[txType]?.explorer_link,
    txHash: axelarTransfer.txs.send_token_txs[txType]?.tx_hash,
    status: axelarTransfer.state,
    transferDirection,
  });
};

const getTxDataFromTransferSequence = (
  transferSequence: TransferEventJSON[],
  direction: 'from' | 'to'
) => {
  const transferSequenceIdx = direction === 'to' ? -1 : 0;
  const transferSequenceObj = transferSequence.at(transferSequenceIdx);
  if (!transferSequenceObj) return undefined;
  if ('ibc_transfer' in transferSequenceObj) {
    return getTxDataFromIbcTransfer(transferSequenceObj.ibc_transfer, direction);
  }
  if ('cctp_transfer' in transferSequenceObj) {
    return getTxDataFromCCTPTransfer(transferSequenceObj.cctp_transfer, direction);
  }
  if ('axelar_transfer' in transferSequenceObj) {
    return getTxDataFromAxelarTransfer(transferSequenceObj.axelar_transfer, direction);
  }
  return undefined;
};

const getAxelarTxUrl = (transfer: TransferStatusJSON) => {
  const transferSequence = transfer.transfer_sequence;
  const axelarTransferWrapped = transferSequence.find(
    (transferSequenceItem) => 'axelar_transfer' in transferSequenceItem
  );
  if (!axelarTransferWrapped) return undefined;
  if ('axelar_transfer' in axelarTransferWrapped)
    return axelarTransferWrapped.axelar_transfer.axelar_scan_link;
  return undefined;
};

export const formSkipStatusResponse = (
  skipStatusResponse: TxStatusResponseJSON
): SkipStatusResponse => {
  const transfer = getTransferFromStatusResponse(skipStatusResponse);
  const fromChainTxData = getTxDataFromTransferSequence(transfer.transfer_sequence, 'from');
  const toChainTxData = getTxDataFromTransferSequence(transfer.transfer_sequence, 'to');
  const routeStatus = [fromChainTxData, toChainTxData]
    .map((data) => data?.routeStatus)
    .filter(isTruthy);
  return {
    axelarTransactionUrl: getAxelarTxUrl(transfer),
    squidTransactionStatus: getSquidStatusFromState(transfer.state),
    routeStatus,
    toChain: toChainTxData?.transactionStatus,
    fromChain: fromChainTxData?.transactionStatus,
    error: skipStatusResponse?.error?.message,
  };
};

export const fetchTransferStatus = ({
  transactionId,
  fromChainId,
  baseUrl,
}: {
  transactionId: string;
  fromChainId: string | undefined;
  baseUrl: string;
}) => {
  return fetchSkipStatus({ transactionHash: transactionId, chainId: fromChainId, baseUrl });
};
