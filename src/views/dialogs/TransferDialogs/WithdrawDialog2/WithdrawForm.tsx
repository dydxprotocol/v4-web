import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import tw from 'twin.macro';
import { formatUnits, parseUnits } from 'viem';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { USDC_DECIMALS, WITHDRAWABLE_ASSETS } from '@/constants/tokens';
import { WalletType } from '@/constants/wallets';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';

import { WarningIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { formatNumberOutput, Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { Withdraw, WithdrawSubtransaction } from '@/state/transfers';

import { track } from '@/lib/analytics/analytics';
import { AttemptBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { orEmptyObj } from '@/lib/typeUtils';

import { TransferRouteOptions } from '../RouteOptions';
import { isValidWithdrawalAddress } from '../utils';
import { AddressInput } from './AddressInput';
import { AmountInput } from './AmountInput';
import { useWithdrawalDeltas, useWithdrawalRoutes } from './queries';
import { useProtocolWithdrawalValidation, useWithdrawStep } from './withdrawHooks';

const WITHDRAWAL_SLIPPAGE_WARN_THRESHOLD = 0.05;

export const WithdrawForm = ({
  amount,
  setAmount,
  destinationAddress,
  setDestinationAddress,
  destinationChain,
  onChainSelect,
  onWithdraw,
  onWithdrawBroadcastUpdate,
  onWithdrawSigned,
}: {
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  destinationAddress: string;
  setDestinationAddress: Dispatch<SetStateAction<string>>;
  destinationChain: string;
  onChainSelect: () => void;
  onWithdraw: (withdraw: Withdraw) => void;
  onWithdrawBroadcastUpdate: (withdrawId: string, subtransaction: WithdrawSubtransaction) => void;
  onWithdrawSigned: (withdrawId: string) => void;
}) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const { sourceAccount } = useAccounts();
  const [selectedSpeed, setSelectedSpeed] = useState<SkipRouteSpeed>('fast');
  const debouncedAmount = useDebounce(amount);
  const selectedToken = WITHDRAWABLE_ASSETS.find((token) => token.chainId === destinationChain);
  const { freeCollateral, marginUsage, equity } = orEmptyObj(
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.data)
  );

  const isEmbeddedWallet =
    sourceAccount.walletInfo?.name === WalletType.Privy ||
    sourceAccount.walletInfo?.name === WalletType.Turnkey;

  const {
    data: routes,
    isFetching,
    error,
  } = useWithdrawalRoutes({
    token: selectedToken,
    amount: debouncedAmount,
    destinationAddress,
  });

  const {
    freeCollateral: updatedFreeCollateral,
    marginUsage: updatedMarginUsage,
    equity: updatedEquity,
  } = orEmptyObj(useWithdrawalDeltas({ withdrawAmount: debouncedAmount }));

  const hasGoFastRoute = routes?.fast?.operations.find((op) => (op as any).goFastTransfer);

  useEffect(() => {
    if (debouncedAmount && !isFetching && !hasGoFastRoute) setSelectedSpeed('slow');
  }, [isFetching, hasGoFastRoute, debouncedAmount]);

  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;

  const { executeWithdraw, isLoading } = useWithdrawStep({
    destinationAddress,
    withdrawRoute: selectedRoute,
    onWithdraw,
    onWithdrawBroadcastUpdate,
    onWithdrawSigned,
  });

  // ------ Errors + Validation ------ //
  useEffect(() => {
    if (error) {
      log('DepositForm/useWithdrawalRoutes', error);
    }
  }, [error]);

  const validationError = useProtocolWithdrawalValidation({
    freeCollateral,
    updatedMarginUsage,
    withdrawAmount: debouncedAmount,
    selectedRoute,
  });

  const isDebouncedAmountSame = debouncedAmount === amount;

  const withdrawDisabled =
    !selectedRoute ||
    destinationAddress === '' ||
    amount === '' ||
    !!validationError ||
    !isDebouncedAmountSame ||
    !isValidWithdrawalAddress(destinationAddress, destinationChain);

  const placeholder = useMemo(() => {
    if (isEmbeddedWallet) {
      return `${stringGetter({ key: STRING_KEYS.ADDRESS })}...`;
    }
    return sourceAccount.address;
  }, [sourceAccount.address, isEmbeddedWallet, stringGetter]);

  const amountOut = formatUnits(BigInt(selectedRoute?.amountOut ?? '0'), USDC_DECIMALS);
  const slippageAmount = AttemptBigNumber(debouncedAmount)?.minus(amountOut);
  const slippagePercent = slippageAmount?.div(debouncedAmount).toNumber() ?? 0;
  const showSlippageWarning =
    selectedRoute != null && slippagePercent > WITHDRAWAL_SLIPPAGE_WARN_THRESHOLD;
  const slippageWarning = showSlippageWarning
    ? stringGetter({
        key: STRING_KEYS.WITHDRAW_SLIPPAGE_WARNING,
        params: {
          DOLLAR_AMOUNT: formatNumberOutput(slippageAmount, OutputType.Number, {
            decimalSeparator,
            groupSeparator,
            selectedLocale,
            fractionDigits: USD_DECIMALS,
          }),
          PERCENT_AMOUNT: formatNumberOutput(slippagePercent * 100, OutputType.Number, {
            decimalSeparator,
            groupSeparator,
            selectedLocale,
            fractionDigits: 0,
          }),
        },
      })
    : undefined;

  const buttonInner = error ? (
    <div tw="row gap-0.5">
      <WithTooltip tooltipString={error.message}>
        <WarningIcon tw="text-color-error" />
      </WithTooltip>
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </div>
  ) : validationError ? (
    <div tw="row gap-0.5">
      <WithTooltip tooltipString={validationError}>
        <WarningIcon tw="text-color-error" />
      </WithTooltip>
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </div>
  ) : showSlippageWarning ? (
    <div tw="row gap-0.5">
      <WithTooltip tooltipString={slippageWarning}>
        <WarningIcon tw="text-color-warning" />
      </WithTooltip>
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </div>
  ) : (
    stringGetter({ key: STRING_KEYS.WITHDRAW })
  );

  const receipt = selectedRoute && (
    <Details
      tw="font-small-book"
      items={[
        {
          key: 'amount',
          label: stringGetter({ key: STRING_KEYS.WITHDRAW }),
          value: (
            <WithTooltip tooltipString={showSlippageWarning ? slippageWarning : undefined}>
              <Output
                tw="inline"
                type={OutputType.Fiat}
                isLoading={isFetching}
                value={amountOut}
                css={showSlippageWarning ? tw`text-color-error` : ''}
              />
            </WithTooltip>
          ),
        },
        {
          key: 'freeCollateral',
          label: stringGetter({ key: STRING_KEYS.FREE_COLLATERAL }),
          value: (
            <DiffOutput
              withDiff={!freeCollateral?.eq(updatedFreeCollateral ?? 0) && !isFetching}
              hasInvalidNewValue={updatedFreeCollateral?.lt(0)}
              type={OutputType.Fiat}
              value={freeCollateral}
              newValue={updatedFreeCollateral}
            />
          ),
        },
        {
          key: 'marginUsage',
          label: stringGetter({ key: STRING_KEYS.MARGIN_USAGE }),
          value: (
            <DiffOutput
              withDiff={!marginUsage?.eq(updatedMarginUsage ?? 0) && !isFetching}
              type={OutputType.Percent}
              value={marginUsage}
              newValue={updatedMarginUsage}
            />
          ),
        },
        {
          key: 'equity',
          label: stringGetter({ key: STRING_KEYS.EQUITY }),
          value: (
            <DiffOutput
              withDiff={!equity?.eq(updatedEquity ?? 0) && !isFetching}
              hasInvalidNewValue={updatedEquity?.lt(0)}
              type={OutputType.Fiat}
              value={equity}
              newValue={updatedEquity}
            />
          ),
        },
      ]}
    />
  );

  const onWithdrawClick = async () => {
    if (withdrawDisabled) return;

    track(
      AnalyticsEvents.WithdrawInitiated({
        sourceAssetDenom: selectedRoute.sourceAssetDenom,
        sourceAssetChainId: selectedRoute.sourceAssetChainId,
        amountIn: selectedRoute.amountIn,
        amountOut: selectedRoute.amountOut,
        usdAmountOut: selectedRoute.usdAmountOut,
        estimatedAmountOut: selectedRoute.estimatedAmountOut,
        swapPriceImpactPercent: selectedRoute.swapPriceImpactPercent,
        estimatedRouteDurationSeconds: selectedRoute.estimatedRouteDurationSeconds,
      })
    );

    executeWithdraw();
  };

  return (
    <div tw="flex h-full min-h-10 flex-col gap-1">
      <AddressInput
        value={destinationAddress}
        onChange={setDestinationAddress}
        destinationChain={destinationChain}
        onDestinationClicked={onChainSelect}
        placeholder={placeholder}
      />
      <AmountInput value={amount} onChange={setAmount} />
      <TransferRouteOptions
        routes={routes}
        isLoading={isFetching}
        disabled={
          !amount || !selectedToken || parseUnits(amount, selectedToken.decimals) === BigInt(0)
        }
        selectedSpeed={selectedSpeed}
        onSelectSpeed={setSelectedSpeed}
        type="withdraw"
      />

      <div tw="flexColumn mt-auto gap-0.5">
        {receipt}

        <Button
          tw="w-full"
          state={{
            isLoading: isFetching || isLoading,
            isDisabled: withdrawDisabled,
          }}
          onClick={onWithdrawClick}
          action={ButtonAction.Primary}
        >
          {buttonInner}
        </Button>
      </div>
    </div>
  );
};
