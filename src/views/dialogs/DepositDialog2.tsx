import { useEffect, useMemo, useState } from 'react';

import { Asset, RouteResponse, UserAddress } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { formatUnits, parseUnits } from 'viem';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { WalletNetworkType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { assetsQueryFn } from '@/hooks/transfers/useTransfers';
import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';

type Balance = {
  chain: string;
  amount: string;
  formattedAmount: string;
  denom: string;
  valueUSD?: string;
};

type TokenWithBalance = {
  token?: Asset;
  balance: Balance;
};

const CHAINID_TO_NAME: { [chainId: string]: string } = {
  '1': 'Ethereum',
  '42161': 'Arbitrum',
  '8453': 'Base',
};

export const DepositDialog2 = ({ setIsOpen }: DialogProps<{}>) => {
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();
  const { skipClient } = useSkipClient();
  const { sourceAccount, dydxAddress, nobleAddress } = useAccounts();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<'normal' | 'fast'>('fast');

  const getUserAddressesByChain = (route: RouteResponse): UserAddress[] => {
    const chains = route.requiredChainAddresses;
    if (!sourceAccount.address || !dydxAddress || !nobleAddress) {
      throw new Error('NOT LOGGED IN?');
    }

    return chains.map((chain) => {
      if (CHAINID_TO_NAME[chain]) {
        return { chainID: chain, address: sourceAccount.address as string };
      }

      if (chain === 'osmosis-1') {
        return { chainID: chain, address: 'osmo1c2jm54xlan3jjfdxeggv7rm3905sscxjr2gtn5' };
      }

      if (chain === 'noble-1') {
        return { chainID: chain, address: nobleAddress };
      }
      
      if (chain === 'dydx-mainnet-1') {
        return { chainID: chain, address: dydxAddress };
      }

      throw new Error("CHAIN ADDRESS NOT HERE!")
    });
  };

  useEffect(() => {
    async function getBalances() {
      if (!sourceAccount.address || sourceAccount.chain !== WalletNetworkType.Evm) {
        return;
      }

      const response = await skipClient.balances({
        chains: {
          '1': {
            address: sourceAccount.address,
            denoms: ['ethereum-native', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
          },
          '42161': {
            address: sourceAccount.address,
            denoms: ['arbitrum-native', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
          },
          '8453': {
            address: sourceAccount.address,
            denoms: ['base-native', '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'],
          },
        },
      });

      const newBalances = Object.keys(CHAINID_TO_NAME)
        .map((chainId) => {
          const denomToBalance = response.chains[chainId]!.denoms;
          return Object.entries(denomToBalance).map(([denom, balance]) => ({
            chain: chainId,
            amount: balance.amount,
            formattedAmount: balance.formattedAmount,
            denom,
            valueUSD: balance.valueUSD,
          }));
        })
        .flat();
      setBalances(newBalances);
    }

    getBalances();
  }, [skipClient, sourceAccount]);

  const { data: assets } = useQuery({
    queryKey: ['transferEligibleAssets'],
    queryFn: () => assetsQueryFn(skipClient),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const tokensWithBalances: TokenWithBalance[] = useMemo(() => {
    return balances
      .map((balance) => {
        const token = assets?.assetsByChain[balance.chain]?.find(
          (t) => t.denom.toLowerCase() === balance.denom.toLowerCase()
        );
        return { token, balance };
      })
      .filter(({ token }) => Boolean(token?.denom));
  }, [balances, assets]);

  const [amount, setAmount] = useState('100');
  const [selectedToken, setSelectedToken] = useState(
    '1,0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  ); // default to mainnet usdc
  const [route, setRoute] = useState<RouteResponse>();
  const [fastRoute, setFastRoute] = useState<RouteResponse>();

  const { usdcDenom } = useTokenConfigs();
  useEffect(() => {
    async function getRoute() {
      const [sourceAssetChainID, sourceAssetDenom] = selectedToken.split(',');
      console.log('getting route with', sourceAssetChainID, sourceAssetDenom);
      if (!sourceAssetChainID || !sourceAssetDenom) return;

      const decimals = tokensWithBalances.find(
        ({ token }) =>
          token?.chainID === sourceAssetChainID &&
          token.denom.toLowerCase() === sourceAssetDenom.toLowerCase()
      )?.token?.decimals;

      if (!decimals) {
        return;
      }

      const response = await skipClient.route({
        sourceAssetDenom,
        sourceAssetChainID,
        destAssetDenom: usdcDenom,
        destAssetChainID: 'dydx-mainnet-1',
        amountIn: parseUnits(amount, decimals).toString(),
        smartRelay: true,
        smartSwapOptions: { evmSwaps: true },
      });

      const fastResponse = await skipClient.route({
        sourceAssetDenom,
        sourceAssetChainID,
        destAssetDenom: usdcDenom,
        destAssetChainID: 'dydx-mainnet-1',
        amountIn: parseUnits(amount, decimals).toString(),
        smartRelay: true,
        smartSwapOptions: { evmSwaps: true },
        goFast: true,
      });

      console.log('route response', response);
      console.log('fast route', fastResponse);
      setRoute(response);

      // @ts-ignore
      if (fastResponse.operations.find((op) => op.goFastTransfer)) {
        setFastRoute(fastResponse);
      } else {
        setFastRoute(undefined);
        setSelectedRoute('normal');
      }
    }

    getRoute();
  }, [selectedToken, amount, tokensWithBalances, skipClient, usdcDenom]);

  // @ts-ignore
  const fastOperationFee = fastRoute?.operations.find((op) => Boolean(op.goFastTransfer))
    ?.goFastTransfer?.fee;
  console.log('fastOperationFee', fastOperationFee);
  const totalFastFee = fastOperationFee
    ? formatUnits(
        BigInt(fastOperationFee.bpsFeeAmount ?? 0) +
          BigInt(fastOperationFee.destinationChainFeeAmount ?? 0) +
          BigInt(fastOperationFee.sourceChainFeeAmount ?? 0),
        6
      )
    : '-';

  const onDeposit = () => {
    const depositRoute = selectedRoute === 'fast' ? fastRoute : route;
    if (!depositRoute) return;
    skipClient.executeRoute({
      route: depositRoute,
      userAddresses: getUserAddressesByChain(depositRoute),
      onTransactionCompleted: async (chainID, txHash, status) => {
        console.log('onTransactionCompleted', chainID, txHash, status);
      },
      // called after the transaction that the user signs gets broadcast on chain
      onTransactionBroadcast: async ({ txHash, chainID }) => {
        console.log(`Transaction broadcasted with tx hash: ${txHash}`, chainID);
      },
      // called after the transaction that the user signs is successfully registered for tracking
      onTransactionTracked: async ({ txHash, chainID }) => {
        console.log(`Transaction tracked with tx hash: ${txHash}`, chainID);
      },
      // called after the user signs a transaction
      onTransactionSigned: async ({ txHash, chainID }) => {
        console.log(`Transaction signed with tx hash: ${txHash}`, chainID);
      },
      // validate gas balance on each chain
      onValidateGasBalance: async ({ chainID, txIndex, status }) => {
        console.log(`Validating gas balance for chain ${chainID}...`, txIndex, status);
      },
    });
  };

  const depositRoute = selectedRoute === 'fast' ? fastRoute : route;

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <div tw="flex flex-col gap-0.375">
        <div>
          Deposit amount:{' '}
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div>Choose token:</div>
        <select
          defaultValue="1,0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          onChange={(e) => {
            setSelectedToken(e.target.value);
          }}
        >
          {tokensWithBalances.map(({ token, balance }) => (
            <option key={token?.denom} value={`${token?.chainID},${token?.denom}`}>
              {balance.formattedAmount} {CHAINID_TO_NAME[token?.chainID!]} {token?.symbol}
              (${balance.valueUSD})
            </option>
          ))}
        </select>
        <div tw="flex gap-1">
          <button
            type="button"
            disabled={!fastRoute}
            onClick={() => setSelectedRoute('fast')}
            tw="flex flex-1 flex-col gap-1 rounded-0.625 bg-color-layer-1 p-1"
            style={{
              outline: selectedRoute === 'fast' ? '5px auto -webkit-focus-ring-color' : undefined,
            }}
          >
            {fastRoute ? (
              <>
                <div>
                  Fast quote: $
                  {fastRoute.amountOut ? formatUnits(BigInt(fastRoute.amountOut), 6) : '-'} USDC
                </div>
                <div>Fee: ${totalFastFee}</div>
              </>
            ) : (
              <div>Instant deposit unavailable</div>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoute('normal')}
            tw="flex flex-1 flex-col gap-1 rounded-0.625 bg-color-layer-1 p-1"
            style={{
              outline: selectedRoute === 'normal' ? '5px auto -webkit-focus-ring-color' : undefined,
            }}
          >
            <div>
              Slow quote: ${route?.amountOut ? formatUnits(BigInt(route.amountOut), 6) : ''} USDC
            </div>
            <div>Fee: ${route?.estimatedFees[0]?.usdAmount}</div>
          </button>
        </div>
        <div tw="mt-1 self-center text-small">+$4,200.69 buying power</div>
        <Button
          disabled={!depositRoute}
          onClick={onDeposit}
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
        >
          Deposit
        </Button>
      </div>
    </Dialog>
  );
};
