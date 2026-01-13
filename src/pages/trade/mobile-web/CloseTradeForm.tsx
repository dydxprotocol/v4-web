import { FormEvent, useCallback, useEffect, useState } from 'react';

import { OrderSide, OrderSizeInputs, TradeFormType } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useTradeErrors } from '@/hooks/TradingForm/useTradeErrors';
import { TradeFormSource, useTradeForm } from '@/hooks/TradingForm/useTradeForm';
import { useClosePositionFormInputs } from '@/hooks/useClosePositionFormInputs';
import { useIsFirstRender } from '@/hooks/useIsFirstRender';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { DropdownMenuTrigger, MobileDropdownMenu } from '@/components/MobileDropdownMenu';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';
import { TradeFormMessages } from '@/views/TradeFormMessages/TradeFormMessages';
import { AllocationSlider } from '@/views/forms/TradeForm/AllocationSlider';
import { PlaceOrderButtonAndReceipt } from '@/views/forms/TradeForm/PlaceOrderButtonAndReceipt';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closePositionFormActions } from '@/state/closePositionForm';
import {
  getClosePositionFormSummary,
  getClosePositionFormValues,
} from '@/state/tradeFormSelectors';

import { mapIfPresent } from '@/lib/do';
import { AttemptBigNumber, MaybeBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { TradeFormHeaderMobile } from './TradeFormHeader';

type Props = {
  market: string;
};

const CloseTradeForm = ({ market }: Props) => {
  const dispatch = useAppDispatch();
  const isFirstRender = useIsFirstRender();
  const stringGetter = useStringGetter();

  const [currentStep, setCurrentStep] = useState<MobilePlaceOrderSteps>();

  const { stepSizeDecimals, tickSizeDecimals, displayableAsset } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );
  const { signedSize: positionSize } = orEmptyObj(useAppSelector(getCurrentMarketPositionData));

  const tradeValues = useAppSelector(getClosePositionFormValues);
  const fullSummary = useAppSelector(getClosePositionFormSummary);
  const { summary } = fullSummary;
  const effectiveSizes = summary.tradeInfo.inputSummary.size;

  const {
    amountInput,
    onAmountInput,
    setLimitPriceToMidPrice,
    limitPriceInput,
    onLimitPriceInput,
  } = useClosePositionFormInputs();

  // default to market
  useEffect(() => {
    dispatch(closePositionFormActions.setOrderType(TradeFormType.MARKET));
    dispatch(closePositionFormActions.setSizeAvailablePercent('1'));
  }, [dispatch]);

  useEffect(() => {
    dispatch(closePositionFormActions.setMarketId(market));
    dispatch(closePositionFormActions.setSizeAvailablePercent('1'));
  }, [market, currentStep, dispatch]);

  const onLastOrderIndexed = useCallback(() => {
    // if (!isFirstRender) {
    //   dispatch(closePositionFormActions.setOrderType(TradeFormType.MARKET));
    //   dispatch(closePositionFormActions.reset());
    //   dispatch(closePositionFormActions.setSizeAvailablePercent('1'));
    //   if (currentStep === MobilePlaceOrderSteps.PlacingOrder) {
    //     setCurrentStep?.(MobilePlaceOrderSteps.Confirmation);
    //   }
    // }
  }, [currentStep, dispatch, isFirstRender, setCurrentStep]);

  const {
    placeOrderError: closePositionError,
    placeOrder,
    shouldEnableTrade,
    tradingUnavailable,
    hasValidationErrors,
  } = useTradeForm({
    source: TradeFormSource.ClosePositionForm,
    fullFormSummary: fullSummary,
    onLastOrderIndexed,
  });

  const {
    shouldPromptUserToPlaceLimitOrder,
    isErrorShownInOrderStatusToast,
    primaryAlert,
    shortAlertKey,
  } = useTradeErrors({
    placeOrderError: closePositionError,
    isClosingPosition: true,
  });

  const {
    type: selectedTradeType,
    side = OrderSide.BUY,
    // isClosingPosition,
  } = tradeValues;

  const useLimit = selectedTradeType === TradeFormType.LIMIT;

  const onTradeTypeChange = useCallback(
    (tradeType: TradeFormType) => {
      // if (isClosingPosition === true) {
      //   return;
      // }

      console.log(tradeType);
      dispatch(closePositionFormActions.setOrderType(tradeType));
    },
    [dispatch, side]
  );

  const onClearInputs = () => {
    dispatch(closePositionFormActions.setOrderType(TradeFormType.MARKET));
    dispatch(closePositionFormActions.reset());
  };

  const formattedPositionSize =
    (positionSize?.toNumber() ?? 0) / 10 ** (stepSizeDecimals ?? TOKEN_DECIMALS);

  const midMarketPriceButton = (
    <$MidPriceButton onClick={setLimitPriceToMidPrice} size={ButtonSize.XSmall}>
      {stringGetter({ key: STRING_KEYS.MID_MARKET_PRICE_SHORT })}
    </$MidPriceButton>
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    switch (currentStep) {
      case MobilePlaceOrderSteps.EditOrder: {
        setCurrentStep?.(MobilePlaceOrderSteps.PreviewOrder);
        break;
      }
      case MobilePlaceOrderSteps.PlacingOrder:
      case MobilePlaceOrderSteps.PlaceOrderFailed:
      case MobilePlaceOrderSteps.Confirmation: {
        break;
      }
      case MobilePlaceOrderSteps.PreviewOrder:
      default: {
        placeOrder({
          onFailure: () => {
            setCurrentStep?.(MobilePlaceOrderSteps.PlaceOrderFailed);
          },
          onPlaceOrder: () => {
            onClearInputs();
          },
        });
        setCurrentStep?.(MobilePlaceOrderSteps.PlacingOrder);
        break;
      }
    }
  };

  return (
    <form
      tw="flexColumn items-center gap-[0.75em] px-2 pb-[12.5rem] pt-[6.5vh]"
      onSubmit={onSubmit}
    >
      <TradeFormHeaderMobile />
      <div tw="w-full text-medium">Close {displayableAsset} Position</div>
      <MobileDropdownMenu
        withPortal={false}
        items={[
          {
            value: TradeFormType.MARKET,
            active: selectedTradeType === TradeFormType.MARKET,
            label: stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT }),
            onSelect: () => onTradeTypeChange(TradeFormType.MARKET),
          },
          {
            value: TradeFormType.LIMIT,
            active: selectedTradeType === TradeFormType.LIMIT,
            label: stringGetter({ key: STRING_KEYS.LIMIT_ORDER_SHORT }),
            onSelect: () => onTradeTypeChange(TradeFormType.LIMIT),
          },
        ]}
      >
        <DropdownMenuTrigger
          tw="w-full bg-[var(--simpleUi-dialog-secondaryColor)]"
          shape={ButtonShape.Pill}
          size={ButtonSize.Base}
        >
          {selectedTradeType === TradeFormType.MARKET
            ? stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT })
            : stringGetter({ key: STRING_KEYS.LIMIT_ORDER_SHORT })}
        </DropdownMenuTrigger>
      </MobileDropdownMenu>

      <div tw="flex w-full justify-between">
        <p tw="text-small text-color-text-0">Current Position</p>
        <$PositionSize isLong={positionSize?.isGreaterThanOrEqualTo(0) ?? false}>
          {Math.abs(positionSize?.toNumber() ?? 0)} {displayableAsset}
        </$PositionSize>
      </div>

      <FormInput
        id="close-position-amount"
        label={<span>{stringGetter({ key: STRING_KEYS.AMOUNT })}</span>}
        decimals={stepSizeDecimals ?? TOKEN_DECIMALS}
        onInput={onAmountInput}
        type={InputType.Number}
        value={amountInput}
        tw="w-full"
      />

      {useLimit && (
        <FormInput
          key="close-position-limit-price"
          id="close-position-limit-price"
          type={InputType.Currency}
          label={
            <>
              <WithTooltip tooltip="limit-price" side="right">
                {stringGetter({ key: STRING_KEYS.LIMIT_PRICE })}
              </WithTooltip>
              <Tag>USD</Tag>
            </>
          }
          onChange={onLimitPriceInput}
          value={limitPriceInput}
          decimals={tickSizeDecimals ?? USD_DECIMALS}
          slotRight={setLimitPriceToMidPrice ? midMarketPriceButton : undefined}
          tw="w-full"
        />
      )}

      <AllocationSlider
        allocationPercentInput={
          tradeValues.size != null && OrderSizeInputs.is.AVAILABLE_PERCENT(tradeValues.size)
            ? (AttemptBigNumber(tradeValues.size.value.value)
                ?.times(100)
                .toFixed(0, BigNumber.ROUND_FLOOR) ?? '')
            : tradeValues.size == null || tradeValues.size.value.value === ''
              ? ''
              : (AttemptBigNumber(effectiveSizes?.allocationPercent)
                  ?.times(100)
                  .toFixed(0, BigNumber.ROUND_FLOOR) ?? '')
        }
        setAllocationInput={(value: string | undefined) => {
          dispatch(
            closePositionFormActions.setSizeAvailablePercent(
              mapIfPresent(value, (v) => MaybeBigNumber(v)?.div(100).toFixed(2)) ?? ''
            )
          );
        }}
      />

      <div
        tw="w-[calc(100vw - 64px)] flexColumn gap-1 py-1.25"
        css={{
          background:
            'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--simpleUi-dialog-backgroundColor))',
        }}
      >
        <TradeFormMessages
          isErrorShownInOrderStatusToast={isErrorShownInOrderStatusToast}
          placeOrderError={closePositionError}
          primaryAlert={primaryAlert}
          shouldPromptUserToPlaceLimitOrder={false}
        />
        {/* {receiptArea} */}
        <$PlaceOrderButtonAndReceipt
          summary={summary}
          actionStringKey={shortAlertKey}
          currentStep={currentStep}
          hasInput={!!amountInput}
          hasValidationErrors={hasValidationErrors}
          onClearInputs={onClearInputs}
          shouldEnableTrade={shouldEnableTrade}
          showDeposit={false}
          tradingUnavailable={tradingUnavailable}
          confirmButtonConfig={{
            stringKey: STRING_KEYS.CLOSE_ORDER,
            buttonTextStringKey: STRING_KEYS.CLOSE_POSITION,
            buttonAction: ButtonAction.Destroy,
          }}
        />
      </div>
    </form>
  );
};

export default CloseTradeForm;

const StyledButton = styled(Button)<{ $isActive?: boolean }>`
  ${({ $isActive }) =>
    $isActive
      ? `--button-textColor: var(--color-text-2);`
      : `--button-textColor: var(--color-text-0);`}
`;

const LongButton = styled(Button)<{ $isLong?: boolean }>`
  ${({ $isLong }) =>
    $isLong ? `background-color: var(--color-gradient-positive);` : 'background-color: transparent'}
`;

const ShortButton = styled(Button)<{ $isShort?: boolean }>`
  ${({ $isShort }) =>
    $isShort
      ? `background-color: var(--color-gradient-negative);`
      : 'background-color: transparent'}
`;

const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}

  width: 100%;
`;

const AvailableRow = styled.div`
  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 8 px 4 px;

  margin-bottom: 8 px;

  width: 100%;
`;
const AvailableLabel = styled.span`
  color: #6b7280;

  font-size: 15 px;
`;
const AvailableValue = styled.div`
  display: flex;

  align-items: center;

  gap: 8 px;

  color: #6b7280;

  font-size: 15 px;
`;

const ToggleRow = styled.div`
  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 0px 0px;

  width: 100%;
`;
const ToggleLabel = styled.span`
  color: #9ca3af;

  font-size: 16 px;

  font-weight: 400;
`;

const $PlaceOrderButtonAndReceipt = styled(PlaceOrderButtonAndReceipt)`
  --withReceipt-backgroundColor: transparent;
`;

const $PositionSize = styled.div<{ isLong: boolean }>`
  ${({ isLong }) =>
    isLong
      ? css`
          color: var(--color-positive) !important;
        `
      : css`
          color: var(--color-negative) !important;
        `}
`;

const $MidPriceButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;
