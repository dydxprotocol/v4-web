import { OfflineSigner } from '@cosmjs/proto-signing';
import { ERC20Approval, RouteResponse, SkipClient, UserAddress } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { Address, maxUint256, WalletClient } from 'viem';
import { useChainId } from 'wagmi';

import ERC20ABI from '@/abi/erc20.json';
import { DYDX_DEPOSIT_CHAIN, isEvmDepositChainId } from '@/constants/chains';
import { CosmosChainId } from '@/constants/graz';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { TokenForTransfer } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';

import { SourceAccount } from '@/state/wallet';

import { VIEM_PUBLIC_CLIENTS } from '@/lib/viem';

// Because our deposit flow only supports ETH and USDC
export function getTokenSymbol(denom: string) {
  if (denom === 'polygon-native') {
    return 'POL';
  }

  if (isNativeTokenDenom(denom)) return 'ETH';

  return 'USDC';
}

export function isNativeTokenDenom(denom: string) {
  return denom.endsWith('native');
}

export function getUserAddressesForRoute(
  route: RouteResponse,
  sourceAccount: SourceAccount,
  nobleAddress?: string,
  dydxAddress?: string
): UserAddress[] {
  const chains = route.requiredChainAddresses;

  return chains.map((chainId) => {
    switch (chainId) {
      case CosmosChainId.Noble:
        if (!nobleAddress) throw new Error('nobleAddress undefined');
        return { chainID: chainId, address: nobleAddress };
      case CosmosChainId.Osmosis:
        // TODO(deposit2.0): handle osmosis case!
        return { chainID: chainId, address: 'osmo1c2jm54xlan3jjfdxeggv7rm3905sscxjr2gtn5' };
      case DYDX_DEPOSIT_CHAIN:
        if (!dydxAddress) throw new Error('dydxAddress undefined');
        return { chainID: chainId, address: dydxAddress };
      default:
        if (
          (isEvmDepositChainId(chainId) && sourceAccount.chain === WalletNetworkType.Evm) ||
          (chainId === SOLANA_MAINNET_ID && sourceAccount.chain === SOLANA_MAINNET_ID)
        ) {
          return { chainID: chainId, address: sourceAccount.address as string };
        }

        throw new Error(`unhandled chainId ${chainId} for user address ${sourceAccount.address}`);
    }
  });
}

export type DepositStep =
  | {
      type: 'network' | 'approve';
      executeStep: (signer: WalletClient) => Promise<boolean>;
    }
  | {
      type: 'deposit';
      // TODO(deposit2.0): add solana signer type support too;
      executeStep: (
        signer: WalletClient | OfflineSigner,
        skipClient: SkipClient
      ) => Promise<boolean>;
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
  onDeposit: ({ txHash, chainId }: { txHash: string; chainId: string }) => void;
}) {
  const walletChainId = useChainId();
  const { skipClient } = useSkipClient();
  const { nobleAddress, dydxAddress } = useAccounts();

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
            return true;
          } catch (e) {
            return false;
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
      dydxAddress
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
          VIEM_PUBLIC_CLIENTS[
            Number(approvalMaybeNeeded.chainId) as keyof typeof VIEM_PUBLIC_CLIENTS
          ];
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
                  chain: signer.chain,
                });
                const receipt = await viemClient.waitForTransactionReceipt({ hash: txHash });
                // TODO future improvement: also check to see if approval amount is sufficient here
                return receipt.status === 'success';
              } catch (e) {
                return false;
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
        try {
          await updatedSkipClient.executeRoute({
            route: depositRoute,
            userAddresses,
            // TODO(deposit2.0): add custom slippage tolerance here
            onTransactionBroadcast: async ({ txHash, chainID }) => {
              onDeposit({ txHash, chainId: chainID });
            },
          });
          return true;
        } catch (e) {
          return false;
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
    ],
    queryFn: getStepsQuery,
  });
}

// Copied from Skip https://github.com/skip-mev/skip-go/blob/147937416c81a69a447f4825b8c86806c5688194/packages/client/src/client.ts#L319
function userAddressHelper(route: RouteResponse, userAddresses: UserAddress[]) {
  let addressList: string[] = [];
  let i = 0;
  for (let j = 0; j < userAddresses.length; j += 1) {
    if (route.requiredChainAddresses[i] !== userAddresses[j]?.chainID) {
      i = j;
      continue;
    }
    addressList.push(userAddresses[j]!.address!);
    i += 1;
  }

  if (addressList.length !== route.requiredChainAddresses.length) {
    addressList = userAddresses.map((x) => x.address);
  }
  return addressList;
}
