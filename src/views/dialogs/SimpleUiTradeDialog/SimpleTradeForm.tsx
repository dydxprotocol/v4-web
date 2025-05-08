import { useCallback, useEffect, useMemo, useState } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { OrderSide } from '@/bonsai/forms/trade/types';
import { isOperationSuccess } from '@/bonsai/lib/operationResult';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { ChevronDownIcon } from '@radix-ui/react-icons';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DisplayUnit, SimpleUiTradeDialogSteps } from '@/constants/trade';

import { useOnOrderIndexed } from '@/hooks/useOnOrderIndexed';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { MarginUsageTag } from '@/components/MarginUsageTag';
import { Output, OutputType } from '@/components/Output';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

import { track } from '@/lib/analytics/analytics';
import { useDisappearingValue } from '@/lib/disappearingValue';
import { operationFailureToErrorParams } from '@/lib/errorHelpers';
import { BIG_NUMBERS } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { ResponsiveSizeInput } from './ResponsiveSizeInput';

export const SimpleTradeForm = ({
  currentStep,
  setCurrentStep,
}: {
  currentStep: SimpleUiTradeDialogSteps;
  setCurrentStep: (step: SimpleUiTradeDialogSteps) => void;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const tradeValues = useAppSelector(getTradeFormValues);
  const { summary } = useAppSelector(getTradeFormSummary);

  const { assetId, displayableAsset, ticker } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const { initialMarginFraction, effectiveInitialMarginFraction } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.marketInfo)
  );

  const [inputValue, setInputValue] = useState('');
  const [placeOrderError, setPlaceOrderError] = useDisappearingValue<string>();

  const marginUsage = summary.accountDetailsAfter?.account?.marginUsage;
  const freeCollateral = summary.accountDetailsBefore?.account?.freeCollateral;
  const usdcSize = summary.tradeInfo.inputSummary.size?.usdcSize;
  const assetSize = summary.tradeInfo.inputSummary.size?.size;

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
    if (currentStep === SimpleUiTradeDialogSteps.Edit) {
      setCurrentStep(SimpleUiTradeDialogSteps.Confirm);
    }
  }, [currentStep, setCurrentStep]);

  const { setUnIndexedClientId } = useOnOrderIndexed(onLastOrderIndexed);

  const onSubmitOrder = async () => {
    const payload = summary.tradePayload;
    if (payload == null) {
      return;
    }
    track(AnalyticsEvents.TradePlaceOrderClick({ ...payload, isClosePosition: false }));
    const result = await accountTransactionManager.placeOrder(payload);
    if (isOperationSuccess(result)) {
      setCurrentStep(SimpleUiTradeDialogSteps.Submit);
      setUnIndexedClientId(payload.clientId.toString());
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

  // Update the form value in Redux as well as local state
  const onChange = useCallback(
    ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
      setInputValue(formattedValue);
      if (displayUnit === DisplayUnit.Asset) {
        dispatch(tradeFormActions.setSizeToken(formattedValue));
      } else {
        dispatch(tradeFormActions.setSizeUsd(formattedValue));
      }
    },
    [dispatch, displayUnit]
  );

  // Toggle between USD and asset units
  const toggleDisplayUnit = () => {
    if (!assetId) return;
    const value = displayUnit === DisplayUnit.Asset ? usdcSize : assetSize;
    const stringValue = value?.toString() ?? '';
    setInputValue(stringValue);

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
      <div tw="row justify-between bg-color-layer-2 px-0.75 py-0.5">
        <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.BUYING_POWER })}</span>
        <Output tw="text-color-text-2" value={buyingPower} type={OutputType.Fiat} />
      </div>
      <div tw="row justify-between bg-color-layer-2 px-0.75 py-0.5">
        <MarginUsageTag marginUsage={marginUsage} />
        <span tw="row gap-0.25 text-color-text-2">
          {stringGetter({ key: STRING_KEYS.FEES })} <ChevronDownIcon />
        </span>
      </div>
    </div>
  );

  const sizeToggle = (
    <button
      type="button"
      aria-label="Toggle display unit"
      tw="row cursor-pointer gap-0.5 px-0.5 py-0.25 hover:bg-color-layer-3"
      onClick={toggleDisplayUnit}
    >
      <Output
        tw="text-color-text-2 font-small-medium"
        type={displayUnit === DisplayUnit.Asset ? OutputType.Fiat : OutputType.Asset}
        value={displayUnit === DisplayUnit.Asset ? usdcSize : assetSize}
      />
      <Icon iconName={IconName.Switch} />
    </button>
  );

  return (
    <div tw="flexColumn items-center gap-2 px-1.25 py-[15vh]">
      <div tw="flexColumn w-full items-center gap-0.5">
        <ResponsiveSizeInput
          inputValue={inputValue}
          onInput={onChange}
          displayableAsset={displayableAsset ?? ''}
        />
        {sizeToggle}
      </div>
      {receiptArea}
      <Button
        type={ButtonType.Button}
        action={tradeValues.side === OrderSide.BUY ? ButtonAction.Create : ButtonAction.Destroy}
        tw="w-full rounded-[1rem]"
        size={ButtonSize.Medium}
        css={{
          '--button-textColor': 'var(--color-layer-0)',
        }}
        onClick={onSubmitOrder}
      >
        {tradeValues.side === OrderSide.BUY
          ? stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
          : stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
      </Button>
    </div>
  );
};
