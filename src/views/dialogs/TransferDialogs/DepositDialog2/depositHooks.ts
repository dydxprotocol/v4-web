import { useCallback } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { OfflineSigner } from '@cosmjs/proto-signing';
import { Erc20Approval, RouteResponse } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { Address, maxUint256, WalletClient } from 'viem';
import { useChainId } from 'wagmi';

import ERC20ABI from '@/abi/erc20.json';
import { AnalyticsEvents } from '@/constants/analytics';
import { isEvmDepositChainId } from '@/constants/chains';
import { getInjectiveChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TokenForTransfer } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { SkipClient, useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { useAppDispatch } from '@/state/appTypes';
import { Deposit, inFlightDepositIds, onDepositBroadcast, updateDeposit } from '@/state/transfers';
import { SourceAccount } from '@/state/wallet';

import { track } from '@/lib/analytics/analytics';
import { sleep } from '@/lib/timeUtils';
import { CHAIN_ID_TO_INFO, EvmDepositChainId, VIEM_PUBLIC_CLIENTS } from '@/lib/viem';

import { getUserAddressesForRoute, parseError, userAddressHelper } from '../utils';
import { isInstantDeposit } from './queries';

// IBC transfer timeout, set when /msgs builds the route's txs. On a multi-tx route
// (e.g. Base -> Injective -> dYdX) the Injective IBC tx is only broadcast after the CCTP
// leg lands, and a CCTP standard-finality transfer takes ~15-20 minutes. A short timeout
// expires before that tx is sent, so it fails on chain with "timeout elapsed".
const DEPOSIT_TIMEOUT_SECONDS = (24 * 60 * 60).toString();

type StepResult =
  | { success: true; errorMessage: undefined }
  | { success: false; errorMessage: string };

export type DepositStep =
  | {
      type: 'network' | 'approve';
      executeStep: (signer: WalletClient) => Promise<StepResult>;
    }
  | {
      type: 'deposit';
      // TODO: also explicitly type support the Phantom Solana signer here
      executeStep: (
        signer: WalletClient | OfflineSigner,
        skipClient: SkipClient
      ) => Promise<StepResult>;
    };

// Prepares all the steps the user needs to take in their wallet to complete their deposit
export function useDepositSteps({
  sourceAccount,
  depositToken,
  depositRoute,
  onDeposit,
}: {
  sourceAccount: SourceAccount;
  depositToken: TokenForTransfer;
  depositRoute?: RouteResponse;
  onDeposit: (deposit: Deposit) => void;
}) {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const walletChainId = useChainId();
  const { skipClient } = useSkipClient();

  const {
    injectiveAddress,
    dydxAddress,
    nobleAddress,
    osmosisAddress,
    localInjectiveWallet,
    localDydxWallet,
  } = useAccounts();

  const getCosmosSigner = useCallback(
    async (chainID: string) => {
      if (chainID === getInjectiveChainId()) {
        if (!localInjectiveWallet?.offlineSigner) {
          throw new Error('No local injectivewallet offline signer. Cannot submit tx');
        }
        return localInjectiveWallet.offlineSigner;
      }

      if (!localDydxWallet?.offlineSigner)
        throw new Error('No local dydxwallet offline signer. Cannot submit tx');

      return localDydxWallet.offlineSigner;
    },
    [localDydxWallet, localInjectiveWallet]
  );

  async function getStepsQuery() {
    if (!depositRoute || !sourceAccount.address) return [];

    const steps: DepositStep[] = [];

    /* ----- 1. Switch network in wallet -------- */
    if (
      // Solana and Keplr wallets dont need to 'switch network'
      sourceAccount.chain === WalletNetworkType.Evm &&
      String(walletChainId) !== depositToken.chainId
    ) {
      steps.push({
        type: 'network',
        executeStep: async (signer: WalletClient) => {
          try {
            await signer.switchChain({ id: Number(depositToken.chainId) });
            // Wait for external wallet to update chains
            await sleep(2000);
            return { success: true };
          } catch (_) {
            try {
              await signer.addChain({
                chain: CHAIN_ID_TO_INFO[Number(depositToken.chainId) as EvmDepositChainId],
              });
              // Wait for external wallet to update chains
              await sleep(2000);
              return { success: true };
            } catch (e) {
              return {
                success: false,
                errorMessage: stringGetter({ key: parseError(e, STRING_KEYS.CHAIN_MISMATCH) }),
              };
            }
          }
        },
      });
    }

    /* ----- 2. Token allowance checks -------- */
    // Only evm tokens may need token allowance checks
    const userAddresses = getUserAddressesForRoute(
      depositRoute,
      sourceAccount,
      nobleAddress,
      injectiveAddress,
      dydxAddress,
      osmosisAddress
    );

    if (isEvmDepositChainId(depositToken.chainId)) {
      const messages = await skipClient.messages({
        amountIn: depositRoute.amountIn,
        destAssetChainId: depositRoute.destAssetChainId,
        destAssetDenom: depositRoute.destAssetDenom,
        operations: depositRoute.operations,
        sourceAssetChainId: depositRoute.sourceAssetChainId,
        sourceAssetDenom: depositRoute.sourceAssetDenom,
        amountOut: depositRoute.estimatedAmountOut ?? '0',
        addressList: userAddressHelper(depositRoute, userAddresses),
        timeoutSeconds: DEPOSIT_TIMEOUT_SECONDS,
      });

      let approvalMaybeNeeded: (Erc20Approval & { chainId: string }) | undefined;

      for (let i = 0; i < (messages?.txs?.length ?? 0); i += 1) {
        const tx = messages?.txs?.[i];
        if (tx && 'evmTx' in tx && tx.evmTx.requiredErc20Approvals?.length) {
          approvalMaybeNeeded = {
            ...tx.evmTx.requiredErc20Approvals[0]!,
            chainId: tx.evmTx.chainId,
          };
        }
      }

      if (approvalMaybeNeeded) {
        const viemClient =
          VIEM_PUBLIC_CLIENTS[Number(approvalMaybeNeeded.chainId) as EvmDepositChainId];
        const allowance = (await viemClient.readContract({
          abi: ERC20ABI,
          address: approvalMaybeNeeded.tokenContract as Address,
          functionName: 'allowance',
          args: [sourceAccount.address, approvalMaybeNeeded.spender],
        })) as bigint;

        if (BigInt(allowance) < BigInt(approvalMaybeNeeded.amount)) {
          steps.push({
            type: 'approve',
            executeStep: async (signer: WalletClient) => {
              try {
                const txHash = await signer.writeContract({
                  account: sourceAccount.address as Address,
                  address: approvalMaybeNeeded.tokenContract as Address,
                  abi: ERC20ABI,
                  functionName: 'approve',
                  args: [approvalMaybeNeeded.spender as Address, maxUint256],
                  chain: CHAIN_ID_TO_INFO[Number(approvalMaybeNeeded.chainId) as EvmDepositChainId],
                });
                const receipt = await viemClient.waitForTransactionReceipt({ hash: txHash });
                // TODO future improvement: also check to see if approval amount is sufficient here
                const isOnChainSuccess = receipt.status === 'success';
                return {
                  success: isOnChainSuccess,
                  errorMessage: isOnChainSuccess
                    ? undefined
                    : stringGetter({ key: STRING_KEYS.YOUR_APPROVAL_FAILED }),
                } as StepResult;
              } catch (e) {
                return {
                  success: false,
                  errorMessage: parseError(
                    e,
                    stringGetter({ key: STRING_KEYS.ERROR_WITH_APPROVAL })
                  ),
                };
              }
            },
          });
        }
      }
    }

    /* ----- 3. Actual deposit transaction -------- */
    steps.push({
      type: 'deposit',
      // TODO(deposit2.0): Update .executeRoute call here once the SDK allows passing in the updated signer object
      // passing in updatedSkipClient is hack until that is available
      executeStep: async (_: unknown, updatedSkipClient: SkipClient) => {
        const depositId = `deposit-${crypto.randomUUID()}`;
        // Origin tx of this deposit, set on the first broadcast. Later broadcasts of a
        // multi-tx route are attached to the same deposit instead of creating a new one.
        let originTx: { txHash: string; chainId: string } | undefined;
        let broadcastCount = 0;
        inFlightDepositIds.add(depositId);

        logBonsaiInfo('depositHooks', 'deposit initiated', {
          depositId,
          depositRoute,
        });

        try {
          await updatedSkipClient.executeRoute({
            getCosmosSigner,
            route: depositRoute,
            userAddresses,
            // Bypass because we manually handle allowance checks above
            bypassApprovalCheck: true,
            timeoutSeconds: DEPOSIT_TIMEOUT_SECONDS,
            // TODO(deposit2.0): add custom slippage tolerance here
            onTransactionBroadcast: async ({ txHash, chainId }) => {
              logBonsaiInfo('depositHooks', 'deposit tx submitted', {
                depositId,
                txHash,
                chainId,
                depositRoute,
              });
              broadcastCount += 1;

              if (originTx) {
                if (dydxAddress) {
                  dispatch(
                    onDepositBroadcast({
                      dydxAddress,
                      depositId,
                      subtransaction: { txHash, chainId, status: 'pending' },
                    })
                  );
                }
                return;
              }
              originTx = { txHash, chainId };

              const baseDeposit = {
                id: depositId,
                type: 'deposit' as const,
                txHash,
                chainId,
                status: 'pending' as const,
                tokenAmount: depositRoute.amountIn,
                estimatedAmountUsd: depositRoute.usdAmountOut ?? '',
                isInstantDeposit: isInstantDeposit(depositRoute),
              };
              track(
                AnalyticsEvents.DepositSubmitted({
                  ...baseDeposit,
                  tokenInChainId: depositToken.chainId,
                  tokenInDenom: depositToken.denom,
                  userAddresses,
                })
              );
              onDeposit({
                ...baseDeposit,
                token: depositToken,
                txsRequired: depositRoute.txsRequired,
                transactions: [{ txHash, chainId, status: 'pending' }],
              });
            },
          });
          return { success: true };
        } catch (e) {
          logBonsaiError('depositHooks', 'error executing Skip Go Deposit Route', {
            error: e,
            route: depositRoute,
          });

          // The route failed after its first tx went out but before every tx was broadcast
          // (e.g. the user rejected the next signature), so the deposit will never complete.
          // Once every tx is out, the tracker decides the final status instead.
          if (originTx && dydxAddress && broadcastCount < depositRoute.txsRequired) {
            dispatch(updateDeposit({ dydxAddress, deposit: { ...originTx, status: 'error' } }));
          }

          return {
            success: false,
            errorMessage: stringGetter({ key: parseError(e, STRING_KEYS.YOUR_DEPOSIT_FAILED) }),
          };
        } finally {
          inFlightDepositIds.delete(depositId);
        }
      },
    });

    return steps;
  }

  return useQuery({
    queryKey: [
      'skip-deposit-steps',
      sourceAccount.address,
      depositRoute?.amountIn,
      depositRoute?.sourceAssetChainId,
      depositRoute?.sourceAssetDenom,
      depositRoute?.operations,
      walletChainId,
    ],
    queryFn: getStepsQuery,
  });
}
