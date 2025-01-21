import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

import { formatUnits, parseUnits } from 'viem';
import { useChainId, useSwitchChain } from 'wagmi';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TokenForTransfer, USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { SkipRouteSpeed, useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import { CoinbaseBrandIcon, WarningIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { AmountInput } from './AmountInput';
import { RouteOptions } from './RouteOptions';
import { useBalance, useDepositRoutes } from './queries';
import { getTokenSymbol, getUserAddressesForRoute } from './utils';

export const DepositForm = ({
  onTokenSelect,
  amount,
  setAmount,
  token,
  onClose,
  onDeposit,
}: {
  onTokenSelect: () => void;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  token: TokenForTransfer;
  onClose: () => void;
  onDeposit: ({ txHash, chainId }: { txHash: string; chainId: string }) => void;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const tokenBalance = useBalance(token.chainId, token.denom);
  const { skipClient } = useSkipClient();
  const walletChainId = useChainId();

  const [selectedSpeed, setSelectedSpeed] = useState<SkipRouteSpeed>('fast');
  const debouncedAmount = useDebounce(amount);
  const {
    data: routes,
    isFetching,
    isPlaceholderData,
    error,
  } = useDepositRoutes(token, debouncedAmount);

  useEffect(() => {
    if (debouncedAmount && !isFetching && routes && !routes.fast) setSelectedSpeed('slow');
  }, [isFetching, routes, debouncedAmount]);

  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;
  const depositRoute = !isPlaceholderData ? selectedRoute : undefined;
  console.log('depositRoute', depositRoute);

  const { sourceAccount, dydxAddress, nobleAddress } = useAccounts();
  const onCorrectChain = useMemo(() => {
    // Solana and Keplr wallets don't need to switch chains
    if (sourceAccount.chain !== WalletNetworkType.Evm) return true;

    return String(walletChainId) === token.chainId;
  }, [sourceAccount.chain, token.chainId, walletChainId]);

  const [awaitingWalletAction, setAwaitingWalletAction] = useState(false);
  const { switchChainAsync } = useSwitchChain();
  const onSwitchChain = async () => {
    setAwaitingWalletAction(true);
    await switchChainAsync({ chainId: Number(token.chainId) });
    setAwaitingWalletAction(false);
  };

  const hasSufficientBalance = depositRoute
    ? tokenBalance.raw && BigInt(depositRoute.amountIn) <= BigInt(tokenBalance.raw)
    : true;

  const depositDisabled = isFetching || !hasSufficientBalance || !depositRoute;

  const depositButtonInner = useMemo(() => {
    if (!hasSufficientBalance) return `Insufficient ${getTokenSymbol(token.denom)}`;
    if (error)
      return (
        <div tw="flex items-center gap-0.5">
          <div tw="flex items-center text-color-error">
            <WarningIcon />
          </div>
          {/* TODO(deposit2.0): localization */}
          <div>Min deposit is $10</div>
        </div>
      );
    if (awaitingWalletAction) return `Continue in wallet...`;
    if (!depositDisabled && !onCorrectChain) return `Switch network`;

    return stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS });
  }, [
    awaitingWalletAction,
    depositDisabled,
    error,
    hasSufficientBalance,
    onCorrectChain,
    stringGetter,
    token.denom,
  ]);

  const onDepositClick = async () => {
    if (depositDisabled) return;

    setAwaitingWalletAction(true);
    const userAddresses = getUserAddressesForRoute(
      depositRoute,
      sourceAccount,
      nobleAddress,
      dydxAddress
    );

    try {
      await skipClient.executeRoute({
        // TODO(deposit2.0): add custom slippageTolerancePercentage here too;
        route: depositRoute,
        userAddresses,
        onApproveAllowance: async ({ status }) => {
          console.log('allowance approved', status);
        },
        onValidateGasBalance: async ({ txIndex, status }) => {
          console.log('onValidateGasBalance', txIndex, status);
        },
        onTransactionTracked: async ({ txHash, explorerLink }) => {
          console.log('onTransactionTracked', txHash, explorerLink);
        },
        onTransactionSigned: async ({ chainID }) => {
          console.log('onTransactionSigned', chainID);
        },
        // TODO(deposit2.0): also handle onApproveAllowance here
        onTransactionBroadcast: async ({ txHash, chainID }) => {
          console.log('onTransactionBroadcast', txHash);
          onDeposit({ txHash, chainId: chainID });
        },
      });
    } catch (e) {
      setAwaitingWalletAction(false);
    }
  };

  return (
    <div tw="flex min-h-10 flex-col gap-2 p-1.25">
      <div tw="flex flex-col gap-0.5">
        <AmountInput
          tokenBalance={tokenBalance}
          value={amount}
          onChange={setAmount}
          token={token}
          onTokenClick={onTokenSelect}
          error={error}
        />
        <RouteOptions
          routes={routes}
          isLoading={isFetching}
          disabled={!amount || parseUnits(amount, token.decimals) === BigInt(0)}
          selectedSpeed={selectedSpeed}
          onSelectSpeed={setSelectedSpeed}
        />
        <div tw="flex flex-col gap-0.5">
          <div tw="flex items-center gap-1">
            <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
            {/* TODO(deposit2): localization */}
            <div tw="text-color-text-0">or</div>
            <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
          </div>
          <Button
            onClick={() => {
              dispatch(openDialog(DialogTypes.CoinbaseDepositDialog({})));
              onClose();
            }}
            type={ButtonType.Button}
            tw="flex items-center border border-solid border-color-border bg-color-layer-4 px-2 py-1 font-medium"
          >
            {/* TODO(deposit2): localization */}
            <div>
              Deposit with <span tw="sr-only">Coinbase</span>
            </div>
            <div tw="flex">
              <CoinbaseBrandIcon />
            </div>
          </Button>
        </div>
      </div>
      <div tw="flex flex-col gap-0.5">
        <Button
          tw="w-full"
          onClick={onCorrectChain ? onDepositClick : onSwitchChain}
          state={{ isDisabled: depositDisabled, isLoading: isFetching }}
          disabled={depositDisabled}
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
        >
          {depositButtonInner}
        </Button>
        {/* TODO(deposit2.0): Show difference between current and new balance here */}
        <div tw="flex justify-between text-small">
          {/* TODO(deposit2.0): localization */}
          <div tw="text-color-text-0">Available balance</div>
          <div style={{ color: isFetching ? 'var(--color-text-0)' : undefined }}>
            +
            <Output
              tw="inline"
              type={OutputType.Fiat}
              value={formatUnits(BigInt(depositRoute?.amountOut ?? 0), USDC_DECIMALS)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
