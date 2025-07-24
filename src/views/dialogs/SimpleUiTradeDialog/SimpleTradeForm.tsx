import { useCallback, useEffect, useState } from 'react';

import { OrderSide, OrderSizeInputs, TradeFormType } from '@/bonsai/forms/trade/types';
import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';
import tw from 'twin.macro';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import {
  DisplayUnit,
  QUICK_LIMIT_OPTIONS,
  QuickLimitOption,
  SimpleUiTradeDialogSteps,
} from '@/constants/trade';

import { useTradeErrors } from '@/hooks/TradingForm/useTradeErrors';
import { TradeFormSource, useTradeForm } from '@/hooks/TradingForm/useTradeForm';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { MarginUsageTag } from '@/components/MarginUsageTag';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { HorizontalSeparatorFiller } from '@/components/Separator';
import { SimpleUiPopover } from '@/components/SimpleUiPopover';
import { TradeFormMessages } from '@/views/TradeFormMessages/TradeFormMessages';
import { useTradeTypeOptions } from '@/views/forms/TradeForm/useTradeTypeOptions';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { openDialog } from '@/state/dialogs';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

import { track } from '@/lib/analytics/analytics';
import { AttemptBigNumber, BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
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

  const [placeOrderPayload, setPlaceOrderPayload] = useState<PlaceOrderPayload>();

  const { selectedTradeType } = useTradeTypeOptions();

  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const tradeValues = useAppSelector(getTradeFormValues);
  const fullFormSummary = useAppSelector(getTradeFormSummary);
  const { complianceState } = useComplianceState();
  const { summary } = fullFormSummary;
  const midPrice = useAppSelector(BonsaiHelpers.currentMarket.midPrice.data);
  const buyingPower = useAppSelector(BonsaiHelpers.currentMarket.account.buyingPower);
  const { assetId, displayableAsset, stepSizeDecimals, ticker, tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const marginUsage = summary.accountDetailsAfter?.account?.marginUsage;
  const effectiveSizes = orEmptyObj(summary.tradeInfo.inputSummary.size);

  useEffect(() => {
    if (ticker) {
      dispatch(tradeFormActions.setMarketId(ticker));
    }
  }, [ticker, dispatch]);

  const onLastOrderIndexed = useCallback(() => {
    if (currentStep === SimpleUiTradeDialogSteps.Submit) {
      setCurrentStep(SimpleUiTradeDialogSteps.Confirm);
    }
  }, [currentStep, setCurrentStep]);

  const { placeOrderError, placeOrder, unIndexedClientId, shouldEnableTrade } = useTradeForm({
    source: TradeFormSource.SimpleTradeForm,
    fullFormSummary,
    onLastOrderIndexed,
  });

  const {
    shouldPromptUserToPlaceLimitOrder,
    isErrorShownInOrderStatusToast,
    primaryAlert,
    shortAlertKey,
  } = useTradeErrors({
    placeOrderError,
  });

  const onSubmitOrder = async () => {
    const payload = summary.tradePayload;
    if (payload == null) {
      return;
    }
    setCurrentStep(SimpleUiTradeDialogSteps.Submit);
    placeOrder({
      onPlaceOrder: (tradePayload) => {
        setPlaceOrderPayload(tradePayload);
        dispatch(tradeFormActions.reset());
      },
      onFailure: () => {
        setCurrentStep(SimpleUiTradeDialogSteps.Error);
      },
    });
  };

  const onUSDCInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    const formattedValueBN = MustBigNumber(formattedValue);
    if ((formattedValueBN.decimalPlaces() ?? 0) > USD_DECIMALS) {
      return;
    }
    dispatch(tradeFormActions.setSizeUsd(formattedValue));
  };

  const onSizeInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    const formattedValueBN = MustBigNumber(formattedValue);
    if ((formattedValueBN.decimalPlaces() ?? 0) > (stepSizeDecimals ?? TOKEN_DECIMALS)) {
      return;
    }
    dispatch(tradeFormActions.setSizeToken(formattedValue));
  };

  const onLimitPriceInput = ({
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const formattedValueBN = MustBigNumber(formattedValue);
    if ((formattedValueBN.decimalPlaces() ?? 0) > (tickSizeDecimals ?? TOKEN_DECIMALS)) {
      return;
    }
    dispatch(tradeFormActions.setLimitPrice(formattedValue));
  };

  const decimals = stepSizeDecimals ?? TOKEN_DECIMALS;

  const inputConfigs = {
    [DisplayUnit.Asset]: {
      onInput: onSizeInput,
      type: InputType.Number,
      outputType: OutputType.Number,
      decimals,
      inputUnit: DisplayUnit.Asset,
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
      inputUnit: DisplayUnit.Fiat,
      value:
        tradeValues.size != null && OrderSizeInputs.is.USDC_SIZE(tradeValues.size)
          ? tradeValues.size.value.value
          : tradeValues.size == null || tradeValues.size.value.value === ''
            ? ''
            : AttemptBigNumber(effectiveSizes.usdcSize)?.toFixed(USD_DECIMALS) ?? '',
    },
  };

  const limitPriceInput = (
    <div tw="flexColumn items-center gap-0.25">
      <span tw="font-mini-book">When {displayableAsset} price reaches</span>
      <ResponsiveSizeInput
        inputValue={tradeValues.limitPrice ?? ''}
        inputType={InputType.Number}
        onInput={onLimitPriceInput}
        fractionDigits={tickSizeDecimals}
        displayableAsset={displayableAsset ?? ''}
        minFontSize={32}
        maxFontSize={32}
        inputUnit={DisplayUnit.Fiat}
      />
    </div>
  );

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

  const priceImpact = summary.tradeInfo.inputSummary.worstFillPrice
    ? midPrice
      ? midPrice.minus(summary.tradeInfo.inputSummary.worstFillPrice)
      : 0
    : 0;

  const receiptArea = (
    <div tw="flexColumn w-full gap-[1px] overflow-hidden rounded-[1rem] font-small-book">
      <div tw="row justify-between bg-[var(--simpleUi-dialog-secondaryColor)] px-0.75 py-0.5">
        <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.BUYING_POWER })}</span>
        <Output tw="text-color-text-2" value={buyingPower} type={OutputType.Fiat} />
      </div>
      <div tw="row justify-between bg-[var(--simpleUi-dialog-secondaryColor)] px-0.75 py-0.5">
        <MarginUsageTag marginUsage={marginUsage} />
        <SimpleUiPopover
          tw="[data-state='open']:rotate-180"
          withPortal={false}
          side="top"
          content={
            <div tw="grid gap-0.5 p-0.5">
              <span tw="text-color-text-1">
                {stringGetter({ key: STRING_KEYS.ESTIMATED_COST })}
              </span>
              <div tw="row justify-between gap-1">
                <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.FEE })}</span>
                <Output
                  tw="text-color-text-2"
                  useGrouping
                  type={OutputType.Fiat}
                  value={summary.tradeInfo.fee ?? 0}
                />
              </div>
              {selectedTradeType === TradeFormType.MARKET && (
                <div tw="row justify-between gap-1">
                  <span tw="text-color-text-0">
                    {stringGetter({ key: STRING_KEYS.PRICE_IMPACT })}
                  </span>
                  <Output
                    tw="text-color-text-2"
                    useGrouping
                    type={OutputType.Fiat}
                    value={priceImpact}
                    showSign={ShowSign.None}
                  />
                </div>
              )}
              <HorizontalSeparatorFiller />
              <div tw="row justify-between gap-1">
                <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.TOTAL })}</span>
                <Output
                  useGrouping
                  tw="text-color-text-2"
                  showSign={ShowSign.None}
                  type={OutputType.Fiat}
                  value={summary.tradeInfo.total ?? 0}
                />
              </div>
            </div>
          }
        >
          <$FeeTrigger>
            {stringGetter({ key: STRING_KEYS.FEES })} <ChevronDownIcon />
          </$FeeTrigger>
        </SimpleUiPopover>
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
        clientId={unIndexedClientId}
        payload={placeOrderPayload}
        onClose={onClose}
      />
    );
  }

  const inputConfig = inputConfigs[displayUnit];

  const isDepositNeeded =
    summary.accountDetailsBefore?.account?.freeCollateral.lte(0) &&
    complianceState === ComplianceStates.FULL_ACCESS;

  const onDepositFunds = () => {
    dispatch(openDialog(DialogTypes.Deposit2({})));
    onClose();
  };

  const placeOrderButton = isDepositNeeded ? (
    <Button
      type={ButtonType.Button}
      action={ButtonAction.SimplePrimary}
      tw="w-full rounded-[1rem] disabled:[--button-textColor:var(--color-text-0)]"
      size={ButtonSize.Large}
      onClick={onDepositFunds}
    >
      {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
    </Button>
  ) : (
    <Button
      type={ButtonType.Button}
      action={tradeValues.side === OrderSide.BUY ? ButtonAction.Create : ButtonAction.Destroy}
      tw="w-full rounded-[1rem] disabled:[--button-textColor:var(--color-text-0)]"
      size={ButtonSize.Large}
      css={{
        '--button-textColor': 'var(--color-layer-0)',
      }}
      state={{ isDisabled: !shouldEnableTrade }}
      onClick={onSubmitOrder}
    >
      {shortAlertKey
        ? stringGetter({ key: shortAlertKey })
        : tradeValues.side === OrderSide.BUY
          ? stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
          : stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
    </Button>
  );

  const onQuickLimitClick = (quickLimit: QuickLimitOption) => {
    const percentBN = MustBigNumber(quickLimit).div(100);

    const multiplier =
      tradeValues.side === OrderSide.BUY
        ? BIG_NUMBERS.ONE.minus(percentBN)
        : BIG_NUMBERS.ONE.plus(percentBN);

    dispatch(
      tradeFormActions.setLimitPrice(
        midPrice?.times(multiplier).toFixed(tickSizeDecimals ?? TOKEN_DECIMALS) ?? ''
      )
    );

    track(
      AnalyticsEvents.TradeQuickLimitOptionClick({
        quickLimit,
        side: tradeValues.side,
        marketId: ticker ?? '',
      })
    );
  };

  const quickLimitSizeButtons = (
    <div tw="row gap-0.5">
      {QUICK_LIMIT_OPTIONS.map((quickLimit: QuickLimitOption) => (
        <Button
          tw="[--button-backgroundColor:var(--simpleUi-dialog-primaryColor)]"
          key={quickLimit}
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.Small}
          onClick={() => onQuickLimitClick(quickLimit)}
        >
          {quickLimit === '0'
            ? stringGetter({ key: STRING_KEYS.MID_MARKET_PRICE_SHORT })
            : `${tradeValues.side === OrderSide.BUY ? '-' : ''}${quickLimit}%`}
        </Button>
      ))}
    </div>
  );

  return (
    <div tw="flexColumn items-center gap-2 px-1.25 pb-[12.5rem] pt-[6.5vh]">
      <div tw="flexColumn w-full items-center gap-0.5">
        <ResponsiveSizeInput
          inputValue={inputConfig.value}
          inputType={inputConfig.type}
          onInput={inputConfig.onInput}
          displayableAsset={displayableAsset ?? ''}
          fractionDigits={inputConfig.decimals}
          inputUnit={inputConfig.inputUnit}
        />
        {sizeToggle}
      </div>
      {tradeValues.type === TradeFormType.LIMIT && (
        <div tw="flexColumn items-center gap-1">
          {limitPriceInput}
          {quickLimitSizeButtons}
        </div>
      )}

      <div
        tw="flexColumn fixed bottom-0 left-0 right-0 gap-1 px-1.25 py-1.25"
        css={{
          background:
            'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--simpleUi-dialog-backgroundColor))',
        }}
      >
        <TradeFormMessages
          isErrorShownInOrderStatusToast={isErrorShownInOrderStatusToast}
          placeOrderError={placeOrderError}
          primaryAlert={primaryAlert}
          shouldPromptUserToPlaceLimitOrder={shouldPromptUserToPlaceLimitOrder}
        />
        {receiptArea}
        {placeOrderButton}
      </div>
    </div>
  );
};

const $FeeTrigger = styled.button.attrs({
  type: 'button',
})`
  ${tw`row gap-0.25 text-color-text-2`}

  svg {
    color: var(--color-text-0);
  }

  &[data-state='open'] {
    svg {
      transition: rotate 0.3s var(--ease-out-expo);
      rotate: -0.5turn;
    }
  }
`;
