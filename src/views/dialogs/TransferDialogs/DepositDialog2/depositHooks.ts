import { OfflineSigner } from '@cosmjs/proto-signing';
import { ERC20Approval, RouteResponse, SkipClient } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { Address, WalletClient, maxUint256 } from 'viem';
import { useChainId } from 'wagmi';

import ERC20ABI from '@/abi/erc20.json';
import { AnalyticsEvents } from '@/constants/analytics';
import { isEvmDepositChainId } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';
import { TokenForTransfer } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Deposit } from '@/state/transfers';
import { SourceAccount } from '@/state/wallet';

import { track } from '@/lib/analytics/analytics';
import { sleep } from '@/lib/timeUtils';
import { CHAIN_ID_TO_INFO, EvmDepositChainId, VIEM_PUBLIC_CLIENTS } from '@/lib/viem';

import { getUserAddressesForRoute, parseError, userAddressHelper } from '../utils';
import { isInstantDeposit } from './queries';

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
  const walletChainId = useChainId();
  const { skipClient } = useSkipClient();
  const { nobleAddress, dydxAddress, osmosisAddress } = useAccounts();

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
      dydxAddress,
      osmosisAddress
    );

    if (isEvmDepositChainId(depositToken.chainId)) {
      const messages = await skipClient.messages({
        ...depositRoute,
        amountOut: depositRoute.estimatedAmountOut ?? '0',
        addressList: userAddressHelper(depositRoute, userAddresses),
      });

      let approvalMaybeNeeded: (ERC20Approval & { chainId: string }) | undefined;
      for (let i = 0; i < messages.txs.length; i += 1) {
        const tx = messages.txs[i];
        if (tx && 'evmTx' in tx && tx.evmTx.requiredERC20Approvals.length) {
          approvalMaybeNeeded = {
            ...tx.evmTx.requiredERC20Approvals[0]!,
            chainId: tx.evmTx.chainID,
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

        try {
          await updatedSkipClient.executeRoute({
            route: depositRoute,
            userAddresses,
            // Bypass because we manually handle allowance checks above
            bypassApprovalCheck: true,
            // TODO(deposit2.0): add custom slippage tolerance here
            onTransactionBroadcast: async ({ txHash, chainID }) => {
              const baseDeposit = {
                id: depositId,
                type: 'deposit' as const,
                txHash,
                chainId: chainID,
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
                })
              );
              onDeposit({ ...baseDeposit, token: depositToken });
            },
          });
          return { success: true };
        } catch (e) {
          return {
            success: false,
            errorMessage: stringGetter({ key: parseError(e, STRING_KEYS.YOUR_DEPOSIT_FAILED) }),
          };
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
      depositRoute?.sourceAssetChainID,
      depositRoute?.sourceAssetDenom,
      depositRoute?.operations,
      walletChainId,
    ],
    queryFn: getStepsQuery,
  });
}
