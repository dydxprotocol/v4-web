import { useCallback, useEffect, useState } from 'react';

import { OrderSizeInputs, TradeFormType } from '@/bonsai/forms/trade/types';
import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { DisplayUnit, SimpleUiTradeDialogSteps } from '@/constants/trade';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useTradeErrors } from '@/hooks/TradingForm/useTradeErrors';
import { TradeFormSource, useTradeForm } from '@/hooks/TradingForm/useTradeForm';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { MarginUsageTag } from '@/components/MarginUsageTag';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { HorizontalSeparatorFiller } from '@/components/Separator';
import { SimpleUiPopover } from '@/components/SimpleUiPopover';
import { TradeFormMessages } from '@/views/TradeFormMessages/TradeFormMessages';
import { useTradeTypeOptions } from '@/views/forms/TradeForm/useTradeTypeOptions';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { closePositionFormActions } from '@/state/closePositionForm';
import {
  getClosePositionFormSummary,
  getClosePositionFormValues,
} from '@/state/tradeFormSelectors';

import { getIndexerPositionSideStringKey } from '@/lib/enumToStringKeyHelpers';
import { AttemptBigNumber, MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { ResponsiveSizeInput } from './ResponsiveSizeInput';
import { SimpleTradeSteps } from './SimpleTradeSteps';

export const SimpleCloseForm = ({
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

  const currentPositionData = useAppSelector(getCurrentMarketPositionData);
  const { signedSize: currentPositionSize, side: currentPositionSide } = currentPositionData ?? {};
  const currentSizeBN = MustBigNumber(currentPositionSize).abs();

  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const tradeValues = useAppSelector(getClosePositionFormValues);
  const fullFormSummary = useAppSelector(getClosePositionFormSummary);
  const { summary } = fullFormSummary;
  const midPrice = useAppSelector(BonsaiHelpers.currentMarket.midPrice.data);
  const { assetId, displayableAsset, stepSizeDecimals, ticker } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const marginUsage = summary.accountDetailsAfter?.account?.marginUsage;
  const effectiveSizes = orEmptyObj(summary.tradeInfo.inputSummary.size);

  useEffect(() => {
    if (ticker) {
      dispatch(closePositionFormActions.setMarketId(ticker));
    }
  }, [ticker, dispatch]);

  const onLastOrderIndexed = useCallback(() => {
    if (currentStep === SimpleUiTradeDialogSteps.Submit) {
      setCurrentStep(SimpleUiTradeDialogSteps.Confirm);
    }
  }, [currentStep, setCurrentStep]);

  const { placeOrderError, placeOrder, unIndexedClientId, shouldEnableTrade } = useTradeForm({
    source: TradeFormSource.SimpleCloseForm,
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
    isClosingPosition: true,
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
        dispatch(closePositionFormActions.reset());
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
    dispatch(closePositionFormActions.setSizeUsd(formattedValue));
  };

  const onSizeInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    const formattedValueBN = MustBigNumber(formattedValue);
    if ((formattedValueBN.decimalPlaces() ?? 0) > (stepSizeDecimals ?? TOKEN_DECIMALS)) {
      return;
    }
    dispatch(closePositionFormActions.setSizeToken(formattedValue));
  };

  const onPercentCloseInput = (value: number) => {
    dispatch(closePositionFormActions.setSizeAvailablePercent(value.toString()));
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

  const toggleDisplayUnit = () => {
    if (!assetId) return;

    dispatch(
      setDisplayUnit({
        newDisplayUnit: displayUnit === DisplayUnit.Asset ? DisplayUnit.Fiat : DisplayUnit.Asset,
        entryPoint: 'simpleUiCloseForm',
        assetId,
      })
    );
  };

  const priceImpact = summary.tradeInfo.inputSummary.worstFillPrice
    ? midPrice
      ? midPrice.minus(summary.tradeInfo.inputSummary.worstFillPrice)
      : 0
    : 0;

  const positionBefore = currentSizeBN;
  const positionAfterBN = MustBigNumber(summary.accountDetailsAfter?.position?.signedSize.abs());
  const positionAfter = positionAfterBN.toFixed(stepSizeDecimals ?? TOKEN_DECIMALS);
  const sideKey = currentPositionSide ? getIndexerPositionSideStringKey(currentPositionSide) : '';
  const sideColor = {
    [IndexerPositionSide.LONG]: 'var(--color-positive)',
    [IndexerPositionSide.SHORT]: 'var(--color-negative)',
    default: 'var(--color-text-2)',
  }[currentPositionSide ?? 'default'];
  const withDiff = currentPositionSize != null && !currentSizeBN.eq(positionAfterBN);

  const receiptArea = (
    <div tw="flexColumn w-full gap-[1px] overflow-hidden rounded-[1rem] font-small-book">
      <div tw="row justify-between bg-[var(--simpleUi-dialog-secondaryColor)] px-0.75 py-0.5">
        <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.POSITION })}</span>
        <span tw="row gap-0.25">
          <span
            css={{
              color: sideColor,
            }}
          >
            {stringGetter({ key: sideKey })}
          </span>
          <DiffOutput
            tw="text-color-text-2"
            type={OutputType.Asset}
            withDiff={withDiff}
            value={positionBefore}
            newValue={positionAfter}
            fractionDigits={stepSizeDecimals ?? TOKEN_DECIMALS}
          />
          {displayableAsset}
        </span>
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

  const placeOrderButton = (
    <Button
      type={ButtonType.Button}
      action={ButtonAction.Primary}
      tw="w-full rounded-[1rem] disabled:[--button-textColor:var(--color-text-0)]"
      size={ButtonSize.Medium}
      state={{ isDisabled: !shouldEnableTrade }}
      onClick={onSubmitOrder}
    >
      {shortAlertKey
        ? stringGetter({ key: shortAlertKey })
        : stringGetter({ key: STRING_KEYS.CLOSE })}
    </Button>
  );

  const closePositionButtons = (
    <div tw="row gap-0.5">
      {[0.25, 0.5, 0.75, 1].map((percentClose) => (
        <Button
          tw="[--button-backgroundColor:var(--simpleUi-dialog-primaryColor)]"
          key={percentClose}
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.Small}
          onClick={() => onPercentCloseInput(percentClose)}
        >
          {percentClose === 1
            ? stringGetter({ key: STRING_KEYS.FULL_CLOSE })
            : `${percentClose * 100}%`}
        </Button>
      ))}
    </div>
  );

  return (
    <div tw="flexColumn items-center gap-2 px-1.25 pb-[12.5rem] pt-[6.5vh]">
      <div tw="flexColumn h-[100px] w-full items-center gap-0.5">
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
      {closePositionButtons}

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
