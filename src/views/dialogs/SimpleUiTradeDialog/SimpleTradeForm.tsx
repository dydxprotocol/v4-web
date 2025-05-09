import { useCallback, useEffect, useMemo, useState } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { OrderSide, OrderSizeInputs, TradeFormType } from '@/bonsai/forms/trade/types';
import { isOperationSuccess } from '@/bonsai/lib/operationResult';
import { ErrorType } from '@/bonsai/lib/validationErrors';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { ChevronDownIcon } from '@radix-ui/react-icons';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { DisplayUnit, SimpleUiTradeDialogSteps } from '@/constants/trade';

import { ConnectionErrorType, useApiState } from '@/hooks/useApiState';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useOnOrderIndexed } from '@/hooks/useOnOrderIndexed';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { MarginUsageTag } from '@/components/MarginUsageTag';
import { Output, OutputType } from '@/components/Output';
import { useTradeTypeOptions } from '@/views/forms/TradeForm/useTradeTypeOptions';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountId } from '@/state/accountInfoSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { tradeFormActions } from '@/state/tradeForm';
import {
  getCurrentTradePageForm,
  getTradeFormSummary,
  getTradeFormValues,
} from '@/state/tradeFormSelectors';

import { track } from '@/lib/analytics/analytics';
import { operationFailureToErrorParams } from '@/lib/errorHelpers';
import { AttemptBigNumber, BIG_NUMBERS } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { ResponsiveSizeInput } from './ResponsiveSizeInput';
import { SimpleTradeSteps } from './SimpleTradeSteps';

export const SimpleTradeForm = ({
  currentStep,
  setCurrentStep,
  onClose,
}: {
  currentStep: SimpleUiTradeDialogSteps;
  setCurrentStep: (step: SimpleUiTradeDialogSteps) => void;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const { connectionError } = useApiState();
  const { complianceState } = useComplianceState();
  const { selectedTradeType } = useTradeTypeOptions();

  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const tradeValues = useAppSelector(getTradeFormValues);
  const { errors: tradeErrors, summary } = useAppSelector(getTradeFormSummary);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const subaccountNumber = useAppSelector(getSubaccountId);
  const currentForm = useAppSelector(getCurrentTradePageForm);

  const { assetId, displayableAsset, stepSizeDecimals, ticker } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const { initialMarginFraction, effectiveInitialMarginFraction } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.marketInfo)
  );

  const [placeOrderError, setPlaceOrderError] = useState<string>();
  const [clientId, setClientId] = useState<string>();

  const marginUsage = summary.accountDetailsAfter?.account?.marginUsage;
  const freeCollateral = summary.accountDetailsBefore?.account?.freeCollateral;
  const effectiveSizes = orEmptyObj(summary.tradeInfo.inputSummary.size);

  const hasInputErrors =
    !!tradeErrors.some((error) => error.type === ErrorType.error) || currentForm !== 'TRADE';

  useEffect(() => {
    if (ticker) {
      dispatch(tradeFormActions.setMarketId(ticker));
    }
  }, [ticker, dispatch]);

  const buyingPower = useMemo(() => {
    const defaultMaxLeverage = initialMarginFraction
      ? BIG_NUMBERS.ONE.div(initialMarginFraction)
      : null;

    const updatedMaxLeverage = effectiveInitialMarginFraction
      ? BIG_NUMBERS.ONE.div(effectiveInitialMarginFraction)
      : null;

    const maxLeverage = updatedMaxLeverage ?? defaultMaxLeverage;

    return freeCollateral?.times(maxLeverage ?? 1);
  }, [initialMarginFraction, effectiveInitialMarginFraction, freeCollateral]);

  const onLastOrderIndexed = useCallback(() => {
    if (currentStep === SimpleUiTradeDialogSteps.Submit) {
      setCurrentStep(SimpleUiTradeDialogSteps.Confirm);
    }
  }, [currentStep, setCurrentStep]);

  const { setUnIndexedClientId } = useOnOrderIndexed(onLastOrderIndexed);

  const onSubmitOrder = async () => {
    const payload = summary.tradePayload;
    if (payload == null) {
      return;
    }
    setCurrentStep(SimpleUiTradeDialogSteps.Submit);
    track(AnalyticsEvents.TradePlaceOrderClick({ ...payload, isClosePosition: false }));
    const result = await accountTransactionManager.placeOrder(payload);
    if (isOperationSuccess(result)) {
      const payloadClientId = payload.clientId.toString();
      setUnIndexedClientId(payloadClientId);
      setClientId(payloadClientId);
    } else {
      const errorParams = operationFailureToErrorParams(result);
      setPlaceOrderError(
        stringGetter({
          key: errorParams.errorStringKey,
          fallback: errorParams.errorMessage ?? '',
        })
      );
      setCurrentStep(SimpleUiTradeDialogSteps.Error);
    }
  };

  const onUSDCInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    dispatch(tradeFormActions.setSizeUsd(formattedValue));
  };

  const onSizeInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    dispatch(tradeFormActions.setSizeToken(formattedValue));
  };

  const decimals = stepSizeDecimals ?? TOKEN_DECIMALS;

  const inputConfigs = {
    [DisplayUnit.Asset]: {
      onInput: onSizeInput,
      type: InputType.Number,
      outputType: OutputType.Number,
      decimals,
      value:
        tradeValues.size != null && OrderSizeInputs.is.SIZE(tradeValues.size)
          ? tradeValues.size.value.value
          : tradeValues.size == null || tradeValues.size.value.value === ''
            ? ''
            : AttemptBigNumber(effectiveSizes.size)?.toFixed(decimals) ?? '',
    },
    [DisplayUnit.Fiat]: {
      onInput: onUSDCInput,
      type: InputType.Number,
      outputType: OutputType.Fiat,
      decimals: USD_DECIMALS,
      value:
        tradeValues.size != null && OrderSizeInputs.is.USDC_SIZE(tradeValues.size)
          ? tradeValues.size.value.value
          : tradeValues.size == null || tradeValues.size.value.value === ''
            ? ''
            : AttemptBigNumber(effectiveSizes.usdcSize)?.toFixed(USD_DECIMALS) ?? '',
    },
  };

  // Toggle between USD and asset units
  const toggleDisplayUnit = () => {
    if (!assetId) return;

    dispatch(
      setDisplayUnit({
        newDisplayUnit: displayUnit === DisplayUnit.Asset ? DisplayUnit.Fiat : DisplayUnit.Asset,
        entryPoint: 'simpleUiTradeDialog',
        assetId,
      })
    );
  };

  const receiptArea = (
    <div tw="flexColumn w-full gap-[1px] overflow-hidden rounded-[1rem] font-small-book">
      <div tw="row justify-between bg-[var(--simpleUi-dialog-secondaryColor)] px-0.75 py-0.5">
        <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.BUYING_POWER })}</span>
        <Output tw="text-color-text-2" value={buyingPower} type={OutputType.Fiat} />
      </div>
      <div tw="row justify-between bg-[var(--simpleUi-dialog-secondaryColor)] px-0.75 py-0.5">
        <MarginUsageTag marginUsage={marginUsage} />
        <span tw="row gap-0.25 text-color-text-2">
          {stringGetter({ key: STRING_KEYS.FEES })} <ChevronDownIcon />
        </span>
      </div>
    </div>
  );

  const toggleConfig =
    inputConfigs[displayUnit === DisplayUnit.Asset ? DisplayUnit.Fiat : DisplayUnit.Asset];
  const toggleValue = toggleConfig.value.trim().length > 0 ? toggleConfig.value : 0;

  const sizeToggle = (
    <button
      type="button"
      disabled={!assetId}
      aria-label="Toggle display unit"
      tw="row cursor-pointer gap-0.5 rounded-[1rem] px-0.5 py-0.25 text-color-text-0 hover:bg-[var(--simpleUi-dialog-secondaryColor)]"
      onClick={toggleDisplayUnit}
    >
      <Output
        tw="text-color-text-2 font-small-medium"
        type={toggleConfig.outputType}
        value={toggleValue}
        fractionDigits={toggleConfig.decimals}
        slotRight={
          displayUnit === DisplayUnit.Fiat ? (
            <span tw="ml-[0.5ch] text-color-text-2">{displayableAsset}</span>
          ) : null
        }
      />
      <div tw="row size-2 justify-center rounded-[50%] bg-[var(--simpleUi-dialog-secondaryColor)]">
        <Icon iconName={IconName.Switch} />
      </div>
    </button>
  );

  if (currentStep !== SimpleUiTradeDialogSteps.Edit) {
    return (
      <SimpleTradeSteps
        currentStep={currentStep}
        placeOrderError={placeOrderError}
        clientId={clientId}
        payload={summary.tradePayload}
        onClose={onClose}
      />
    );
  }

  const inputConfig = inputConfigs[displayUnit];

  const hasMissingData = subaccountNumber === undefined;

  const closeOnlyTradingUnavailable =
    complianceState === ComplianceStates.CLOSE_ONLY &&
    selectedTradeType !== TradeFormType.MARKET &&
    currentForm !== 'CLOSE_POSITION';

  const tradingUnavailable =
    closeOnlyTradingUnavailable ||
    complianceState === ComplianceStates.READ_ONLY ||
    connectionError === ConnectionErrorType.CHAIN_DISRUPTION;

  const shouldEnableTrade =
    canAccountTrade && !hasMissingData && !hasInputErrors && !tradingUnavailable;

  return (
    <div tw="flexColumn items-center gap-2 px-1.25 pb-[5.25rem] pt-[6.5vh]">
      <div tw="flexColumn w-full items-center gap-0.5">
        <ResponsiveSizeInput
          inputValue={inputConfig.value}
          inputType={inputConfig.type}
          onInput={inputConfig.onInput}
          displayableAsset={displayableAsset ?? ''}
          fractionDigits={inputConfig.decimals}
        />
        {sizeToggle}
      </div>
      {receiptArea}

      <div
        tw="row fixed bottom-0 left-0 right-0 gap-1.25 px-1.25 py-1.25"
        css={{
          background:
            'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--simpleUi-dialog-backgroundColor))',
        }}
      >
        <Button
          type={ButtonType.Button}
          action={tradeValues.side === OrderSide.BUY ? ButtonAction.Create : ButtonAction.Destroy}
          tw="w-full rounded-[1rem] disabled:[--button-textColor:var(--color-text-0)]"
          size={ButtonSize.Medium}
          css={{
            '--button-textColor': 'var(--color-layer-0)',
          }}
          state={{ isDisabled: !shouldEnableTrade }}
          onClick={onSubmitOrder}
        >
          {tradeValues.side === OrderSide.BUY
            ? stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
            : stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
        </Button>
      </div>
    </div>
  );
};
