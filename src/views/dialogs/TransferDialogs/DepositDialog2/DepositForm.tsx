import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { sumBy } from 'lodash';
import { DateTime } from 'luxon';
import { useWalletClient } from 'wagmi';

import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MIN_DEPOSIT_AMOUNT, NumberSign } from '@/constants/numbers';
import { SKIP_GO_FAST_TRANSFER_LIMIT, SKIP_GO_FAST_TRANSFER_MIN_MAP } from '@/constants/skip';
import { ColorToken } from '@/constants/styles/base';
import { TokenForTransfer } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import { WarningIcon } from '@/icons';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { AccentTag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';
import { Deposit } from '@/state/transfers';

import { track } from '@/lib/analytics/analytics';
import { calc } from '@/lib/do';
import { MustBigNumber, MustNumber } from '@/lib/numbers';
import { getStringsForDateTimeDiff } from '@/lib/timeUtils';
import { orEmptyObj } from '@/lib/typeUtils';

import { getTokenSymbol } from '../utils';
import { AmountInput } from './AmountInput';
import { DepositSteps } from './DepositSteps';
import { DepositStep, useDepositSteps } from './depositHooks';
import { isInstantDeposit, useBalance, useDepositDeltas, useDepositRoutes } from './queries';

export const DepositForm = ({
  onTokenSelect,
  amount,
  setAmount,
  token,
  onDeposit,
}: {
  onTokenSelect: () => void;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  token: TokenForTransfer;
  onDeposit: (deposit: Deposit) => void;
}) => {
  const stringGetter = useStringGetter();
  const tokenBalance = useBalance(token.chainId, token.denom);
  const { skipClient } = useSkipClient();
  const { data: walletClient } = useWalletClient();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

  const debouncedAmount = useDebounce(amount);
  const {
    data: routes,
    isFetching,
    isPlaceholderData,
    error,
  } = useDepositRoutes(token, debouncedAmount);

  const fastRouteFee =
    routes?.fast?.estimatedFees &&
    sumBy(routes.fast.estimatedFees, (fee) => MustNumber(fee.amount));

  // Difference between selectedRoute and depositRoute:
  // selectedRoute may be the cached route from the previous query response,
  // whereas depositRoute is undefined while the current route query is still loading
  const selectedRoute = calc(() => {
    if (fastRouteFee != null && fastRouteFee > 0) {
      return routes?.slow;
    }

    return routes?.fast ?? routes?.slow;
  });

  const depositRoute = !isPlaceholderData ? selectedRoute : undefined;
  const skipGoFastTransferMin = SKIP_GO_FAST_TRANSFER_MIN_MAP[token.chainId];

  const isBelowInstantDepositMin =
    skipGoFastTransferMin != null &&
    depositRoute?.usdAmountIn &&
    MustBigNumber(depositRoute.usdAmountIn).lt(skipGoFastTransferMin);

  const isAboveInstantDepositMax =
    depositRoute?.usdAmountIn &&
    MustBigNumber(depositRoute.usdAmountIn).gt(SKIP_GO_FAST_TRANSFER_LIMIT);

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
    !isDepositingMoreThanMin ||
    isAccountViewOnly;

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
        isInstantDeposit: isInstantDeposit(depositRoute),
        sourceAssetDenom: depositRoute.sourceAssetDenom,
        sourceAssetChainId: depositRoute.sourceAssetChainId,
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

  const isGoFastRoute = depositRoute?.operations.find((op) => Boolean((op as any).goFastTransfer));
  const routeSpeed = depositRoute?.estimatedRouteDurationSeconds;
  const routeDuration = Date.now() + (routeSpeed ?? 0) * 1000;
  const { timeString, unitStringKey } = getStringsForDateTimeDiff(
    DateTime.fromMillis(routeDuration)
  );
  const routeSpeedString = routeSpeed
    ? `~${timeString}${stringGetter({ key: unitStringKey })}`
    : undefined;

  const depositMethod = isFetching ? (
    <Output type={OutputType.Text} isLoading value={null} />
  ) : depositRoute && debouncedAmount.trim() !== '' ? (
    isGoFastRoute ? (
      <span tw="row gap-0.25">
        <Icon css={{ color: ColorToken.Yellow1 }} iconName={IconName.Lightning} />
        <span tw="text-color-text-2">{stringGetter({ key: STRING_KEYS.INSTANT })}</span>
        <AccentTag>{stringGetter({ key: STRING_KEYS.FREE })}</AccentTag>
      </span>
    ) : (
      <span>
        <span>{routeSpeedString}</span>
      </span>
    )
  ) : (
    <span tw="text-color-text-0">-</span>
  );

  const receipt = (
    <Details
      tw="font-small-book"
      items={[
        {
          key: 'deposit-method',
          label: stringGetter({ key: STRING_KEYS.DEPOSIT_METHOD }),
          value: depositMethod,
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

  const hasDepositSteps = depositSteps?.length != null && depositSteps.length > 0;

  const depositContent = hasDepositSteps ? (
    <>
      <div tw="row gap-0.5 text-color-text-2">
        <Output tw="font-extra-large-bold" type={OutputType.Number} value={debouncedAmount} />
        <AssetIcon
          tw="[--asset-icon-size:2rem]"
          symbol={getTokenSymbol(token.denom)}
          chainId={token.chainId}
        />
      </div>
      <DepositSteps
        tw="ml-[-0.5rem]"
        steps={depositSteps}
        currentStep={currentStep}
        currentStepError={currentStepError}
        onRetry={retryCurrentStep}
      />
    </>
  ) : (
    <AmountInput
      tokenBalance={tokenBalance}
      value={amount}
      onChange={setAmount}
      token={token}
      onTokenClick={onTokenSelect}
      error={error}
    />
  );

  const noticeMessage = calc(() => {
    if (isBelowInstantDepositMin) {
      return stringGetter({
        key: STRING_KEYS.FREE_INSTANT_DEPOSIT_MIN,
        params: { MIN_AMOUNT: skipGoFastTransferMin },
      });
    }
    if (isAboveInstantDepositMax) {
      return stringGetter({
        key: STRING_KEYS.FREE_INSTANT_DEPOSIT_MAX,
        params: { MAX_AMOUNT: SKIP_GO_FAST_TRANSFER_LIMIT },
      });
    }

    return undefined;
  });

  const depositContentBottom = (
    <div tw="mt-0.5 flex flex-col gap-0.5">
      {currentStepError && (
        <div tw="text-center text-small text-color-error">{currentStepError}</div>
      )}
      {receipt}
      <Button
        tw="w-full"
        onClick={onDepositClick}
        state={{
          isDisabled: depositDisabled,
          isLoading: isFetching || (!depositDisabled && !steps?.length) || awaitingWalletAction,
        }}
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
      >
        {depositButtonInner}
      </Button>
      {noticeMessage && (
        <AlertMessage withAccentText tw="rounded-[0.375rem]" type={AlertType.Notice}>
          {noticeMessage}
        </AlertMessage>
      )}
    </div>
  );

  return (
    <div tw="flex h-full min-h-10 flex-col p-1.25">
      <div tw="flex flex-col gap-0.5">{depositContent}</div>
      <div tw="mt-auto flex flex-col gap-0.75">{depositContentBottom}</div>
    </div>
  );
};
