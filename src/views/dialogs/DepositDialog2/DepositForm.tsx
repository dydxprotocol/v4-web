import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

import { formatUnits, parseUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TokenForTransfer, USDC_DECIMALS } from '@/constants/tokens';

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
import { DepositSteps } from './DepositSteps';
import { RouteOptions } from './RouteOptions';
import { useBalance, useDepositRoutes } from './queries';
import { DepositStep, getTokenSymbol, useDepositSteps } from './utils';

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

  const { data: walletClient } = useWalletClient();

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

  const { sourceAccount } = useAccounts();

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

    if (!walletClient) return <div>Connect wallet</div>;

    return stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS });
  }, [error, hasSufficientBalance, stringGetter, token.denom, walletClient]);

  const { data: steps } = useDepositSteps({
    sourceAccount,
    depositToken: token,
    depositRoute,
    onDeposit,
  });

  const [depositSteps, setDepositSteps] = useState<DepositStep[]>();
  const [currentStep, setCurrentStep] = useState(0);
  const [showRetryCurrentStep, setShowRetryCurrentStep] = useState(false);
  const [awaitingWalletAction, setAwaitingWalletAction] = useState(false);

  // Helpers for fetching updated values within the useEffect for autoPromptStep
  const skipClientRef = useRef(skipClient);
  useEffect(() => {
    skipClientRef.current = skipClient;
  }, [skipClient]);
  const walletClientRef = useRef(walletClient);
  useEffect(() => {
    if (!walletClient) return;
    walletClientRef.current = walletClient;
  }, [walletClient]);

  useEffect(() => {
    async function autoPromptStep() {
      if (!depositSteps || !depositSteps.length || !walletClientRef.current) {
        return;
      }

      const success = await depositSteps[currentStep]?.executeStep(
        walletClientRef.current,
        skipClientRef.current
      );
      if (success && currentStep < depositSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
      if (!success) {
        setShowRetryCurrentStep(true);
      }
    }

    autoPromptStep();
  }, [depositSteps, currentStep]);

  useEffect(() => {
    // reset current deposit steps if the input has changed
    setDepositSteps(undefined);
    setCurrentStep(0);
    setAwaitingWalletAction(false);
    setShowRetryCurrentStep(false);
  }, [token, debouncedAmount, selectedRoute]);

  const onDepositClick = async () => {
    if (depositDisabled || !steps || !walletClient) return;

    setAwaitingWalletAction(true);
    if (steps.length === 1) {
      const success = await steps[0]?.executeStep(walletClient, skipClient);
      if (!success) setAwaitingWalletAction(false);
    } else {
      setDepositSteps(steps);
    }
  };

  const retryCurrentStep = async () => {
    const step = depositSteps?.[currentStep];
    if (!step || !walletClient) return;

    setShowRetryCurrentStep(false);

    const success = await step.executeStep(walletClient, skipClient);
    if (success) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowRetryCurrentStep(true);
    }
  };

  return (
    <div tw="flex min-h-10 flex-col p-1.25">
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
        <div
          tw="flex flex-col gap-0.5"
          style={{ opacity: depositSteps ?? awaitingWalletAction ? '0.5' : '1' }}
        >
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
            disabled={!!depositSteps || awaitingWalletAction}
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
        {!depositSteps?.length && (
          <Button
            tw="mt-2 w-full"
            onClick={onDepositClick}
            state={{
              isDisabled: depositDisabled,
              isLoading: isFetching || (!depositDisabled && !steps?.length) || awaitingWalletAction,
            }}
            disabled={depositDisabled}
            action={ButtonAction.Primary}
            type={ButtonType.Submit}
          >
            {depositButtonInner}
          </Button>
        )}
        {/* TODO(deposit2.0): handle the case where the wallet has lost connection (no walletClient defined) */}
        {depositSteps?.length && (
          <div tw="mt-1">
            <DepositSteps
              steps={depositSteps}
              currentStep={currentStep}
              showRetry={showRetryCurrentStep}
              onRetry={retryCurrentStep}
            />
          </div>
        )}
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
