import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { formatUnits, parseUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';
import { MIN_DEPOSIT_AMOUNT, NumberSign } from '@/constants/numbers';
import { TokenForTransfer, USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { SkipRouteSpeed, useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import { WarningIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppSelector } from '@/state/appTypes';
import { Deposit } from '@/state/transfers';

import { track } from '@/lib/analytics/analytics';
import { MustBigNumber, MustNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { TransferRouteOptions } from '../RouteOptions';
import { getTokenSymbol } from '../utils';
import { AmountInput } from './AmountInput';
import { DepositSteps } from './DepositSteps';
import { OtherDepositOptions } from './OtherDepositOptions';
import { DepositStep, useDepositSteps } from './depositHooks';
import { useBalance, useDepositDeltas, useDepositRoutes } from './queries';

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
  onDeposit: (deposit: Deposit) => void;
}) => {
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

  // Difference between selectedRoute and depositRoute:
  // selectedRoute may be the cached route from the previous query response,
  // whereas depositRoute is undefined while the current route query is still loading
  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;
  const depositRoute = !isPlaceholderData ? selectedRoute : undefined;

  const { freeCollateral } = orEmptyObj(
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.data)
  );

  const { freeCollateral: updatedFreeCollateral } = orEmptyObj(
    useDepositDeltas({ depositAmount: depositRoute?.usdAmountOut })
  );

  const { sourceAccount, localDydxWallet } = useAccounts();

  const signer = useMemo(() => {
    if (sourceAccount.chain === WalletNetworkType.Evm) {
      return walletClient;
    }

    if (sourceAccount.chain === WalletNetworkType.Solana) {
      return window.phantom?.solana;
    }

    if (sourceAccount.chain === WalletNetworkType.Cosmos) {
      return localDydxWallet;
    }

    throw new Error('wallet type not handled');
  }, [localDydxWallet, sourceAccount.chain, walletClient]);

  const hasSufficientBalance = depositRoute
    ? tokenBalance.raw && BigInt(depositRoute.amountIn) <= BigInt(tokenBalance.raw)
    : true;

  const isDebouncedAmountSame = debouncedAmount === amount;
  const isDepositingMoreThanMin = Boolean(
    depositRoute?.usdAmountIn && MustNumber(depositRoute.usdAmountIn) >= MIN_DEPOSIT_AMOUNT
  );

  const hasInput = MustBigNumber(depositRoute?.usdAmountIn).gt(0);

  const depositDisabled =
    isFetching ||
    !hasSufficientBalance ||
    !depositRoute ||
    !isDebouncedAmountSame ||
    !isDepositingMoreThanMin;

  const depositButtonInner = useMemo(() => {
    if (!hasSufficientBalance) return `Insufficient ${getTokenSymbol(token.denom)}`;
    if (hasInput && !isDepositingMoreThanMin) {
      return (
        <div tw="flex items-center gap-0.5">
          <div tw="flex items-center text-color-error">
            <WarningIcon />
          </div>
          <div>
            {stringGetter({
              key: STRING_KEYS.MINIMUM_DEPOSIT,
              params: { MIN_DEPOSIT_USDC: '$10' },
            })}
          </div>
        </div>
      );
    }
    if (error)
      return (
        <div tw="flex items-center gap-0.5">
          <div tw="flex items-center text-color-error">
            <WithTooltip tooltipString={error.message}>
              <WarningIcon />
            </WithTooltip>
          </div>
          <div>
            {stringGetter({
              key: STRING_KEYS.DEPOSIT_FUNDS,
            })}
          </div>
        </div>
      );

    if (!signer) return <div>{stringGetter({ key: STRING_KEYS.RECONNECT_WALLET })}</div>;

    return stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS });
  }, [
    error,
    hasInput,
    hasSufficientBalance,
    stringGetter,
    token.denom,
    signer,
    isDepositingMoreThanMin,
  ]);

  const { data: steps } = useDepositSteps({
    sourceAccount,
    depositToken: token,
    depositRoute,
    onDeposit,
  });

  const [depositSteps, setDepositSteps] = useState<DepositStep[]>();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentStepError, setCurrentStepError] = useState<string>();
  const [awaitingWalletAction, setAwaitingWalletAction] = useState(false);

  const { connectWallet, selectedWallet } = useWalletConnection();

  const connectWagmi = async () => {
    try {
      setAwaitingWalletAction(true);
      await connectWallet({ wallet: selectedWallet, forceConnect: true });
      setAwaitingWalletAction(false);
    } catch (e) {
      setAwaitingWalletAction(false);
    }
  };

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
      if (
        !depositSteps ||
        !depositSteps.length ||
        !walletClientRef.current ||
        !depositSteps[currentStep]
      ) {
        return;
      }

      const { success, errorMessage } = await depositSteps[currentStep].executeStep(
        walletClientRef.current,
        skipClientRef.current
      );
      if (success && currentStep < depositSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
      if (!success) {
        track(AnalyticsEvents.DepositError({ error: errorMessage }));
        setCurrentStepError(errorMessage);
      }
    }

    autoPromptStep();
  }, [depositSteps, currentStep]);

  useEffect(() => {
    // reset current deposit steps if the input has changed
    setDepositSteps(undefined);
    setCurrentStep(0);
    setAwaitingWalletAction(false);
    setCurrentStepError(undefined);
  }, [token, debouncedAmount, selectedRoute]);

  const onDepositClick = async () => {
    if (depositDisabled || !steps) return;

    if (!signer) {
      connectWagmi();
      return;
    }

    setCurrentStepError(undefined);
    setAwaitingWalletAction(true);

    track(
      AnalyticsEvents.DepositInitiated({
        sourceAssetDenom: depositRoute.sourceAssetDenom,
        sourceAssetChainID: depositRoute.sourceAssetChainID,
        amountIn: depositRoute.amountIn,
        amountOut: depositRoute.amountOut,
        usdAmountOut: depositRoute.usdAmountOut,
        estimatedAmountOut: depositRoute.estimatedAmountOut,
        swapPriceImpactPercent: depositRoute.swapPriceImpactPercent,
        estimatedRouteDurationSeconds: depositRoute.estimatedRouteDurationSeconds,
      })
    );

    if (steps.length === 1) {
      const { success, errorMessage } = await steps[0]!.executeStep(signer, skipClient);
      if (!success) {
        setAwaitingWalletAction(false);
        setCurrentStepError(errorMessage);
      }
    } else {
      setDepositSteps(steps);
    }
  };

  const retryCurrentStep = async () => {
    const step = depositSteps?.[currentStep];
    if (!step || !signer) return;

    setCurrentStepError(undefined);

    const { success, errorMessage } = await step.executeStep(signer, skipClient);
    if (success) {
      setCurrentStep((prev) => prev + 1);
    } else {
      track(AnalyticsEvents.DepositError({ error: errorMessage }));
      setCurrentStepError(errorMessage);
    }
  };

  const chainName =
    selectedRoute?.sourceAssetChainID && CHAIN_INFO[selectedRoute.sourceAssetChainID]?.name;

  const gasFeeAdjustment =
    selectedSpeed === 'slow' && chainName ? (
      <span tw="text-color-text-0 font-mini-book">
        {` - ${stringGetter({ key: STRING_KEYS.CHAIN_GAS_FEES, params: { CHAIN: chainName } })}`}
      </span>
    ) : null;

  const receipt = selectedRoute && (
    <Details
      tw="font-small-book"
      items={[
        {
          key: 'amount',
          label: stringGetter({ key: STRING_KEYS.ESTIMATED_AMOUNT_RECEIVED }),
          value: (
            <Output
              tw="inline"
              type={OutputType.Fiat}
              isLoading={isFetching}
              value={formatUnits(BigInt(selectedRoute.amountOut), USDC_DECIMALS)}
              slotRight={gasFeeAdjustment}
            />
          ),
        },
        {
          key: 'availableBalance',
          label: stringGetter({ key: STRING_KEYS.AVAILABLE_BALANCE }),
          value: (
            <DiffOutput
              withDiff={!!depositRoute && updatedFreeCollateral?.gt(0)}
              isLoading={isFetching}
              type={OutputType.Fiat}
              sign={NumberSign.Positive}
              value={freeCollateral}
              newValue={updatedFreeCollateral}
              newValueSlotLeft="~"
            />
          ),
        },
      ]}
    />
  );

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
        <TransferRouteOptions
          routes={routes}
          isLoading={isFetching}
          disabled={!amount || parseUnits(amount, token.decimals) === BigInt(0)}
          selectedSpeed={selectedSpeed}
          onSelectSpeed={setSelectedSpeed}
          type="deposit"
        />
      </div>
      <div tw="flex flex-col gap-0.75">
        {!depositSteps?.length && (
          <div tw="mt-2 flex flex-col gap-0.375">
            {currentStepError && (
              <div tw="text-center text-small text-color-error">{currentStepError}</div>
            )}
            <Button
              tw="w-full"
              onClick={onDepositClick}
              state={{
                isDisabled: depositDisabled,
                isLoading:
                  isFetching || (!depositDisabled && !steps?.length) || awaitingWalletAction,
              }}
              action={ButtonAction.Primary}
              type={ButtonType.Submit}
            >
              {depositButtonInner}
            </Button>
          </div>
        )}
        {depositSteps?.length && (
          <div tw="my-1">
            <DepositSteps
              steps={depositSteps}
              currentStep={currentStep}
              currentStepError={currentStepError}
              onRetry={retryCurrentStep}
            />
          </div>
        )}
        {receipt}
      </div>
      {!depositSteps?.length && !awaitingWalletAction && (
        <OtherDepositOptions
          awaitingWalletAction={awaitingWalletAction}
          depositSteps={depositSteps}
          onClose={onClose}
        />
      )}
    </div>
  );
};
