import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { TradeFormType } from '@/bonsai/forms/trade/types';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import styled, { css } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps, ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useTradeErrors } from '@/hooks/TradingForm/useTradeErrors';
import { TradeFormSource, useTradeForm } from '@/hooks/TradingForm/useTradeForm';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { ToggleButton } from '@/components/ToggleButton';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormRawState, getTradeFormSummary } from '@/state/tradeFormSelectors';

import { CanvasOrderbook } from '../CanvasOrderbook/CanvasOrderbook';
import { TradeFormAlertContent } from '../TradeFormMessages/TradeFormAlertContent';
import { TradeFormMessages } from '../TradeFormMessages/TradeFormMessages';
import { TradeSideTabs } from '../TradeSideTabs';
import { AdvancedTradeOptions } from './TradeForm/AdvancedTradeOptions';
import { MarginAndLeverageButtons } from './TradeForm/MarginAndLeverageButtons';
import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';
import { PositionPreview } from './TradeForm/PositionPreview';
import { TradeFormInputs } from './TradeForm/TradeFormInputs';
import { TradeSizeInputs } from './TradeForm/TradeSizeInputs';
import { useTradeTypeOptions } from './TradeForm/useTradeTypeOptions';

type ElementProps = {
  currentStep?: MobilePlaceOrderSteps;
  setCurrentStep?: (step: MobilePlaceOrderSteps) => void;
  onConfirm?: () => void;
};

type StyleProps = {
  className?: string;
};

export const TradeForm = ({
  currentStep,
  setCurrentStep,
  onConfirm,
  className,
}: ElementProps & StyleProps) => {
  const [showOrderbook, setShowOrderbook] = useState(false);

  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);
  const fullTradeFormState = useAppSelector(getTradeFormSummary);

  const onLastOrderIndexed = useCallback(() => {
    if (currentStep === MobilePlaceOrderSteps.PlacingOrder) {
      setCurrentStep?.(MobilePlaceOrderSteps.Confirmation);
    }
  }, [currentStep, setCurrentStep]);

  const {
    placeOrderError,
    placeOrder,
    hasValidationErrors,
    tradingUnavailable,
    shouldEnableTrade,
    hasMarketData,
  } = useTradeForm({
    source: TradeFormSource.TradeForm,
    fullFormSummary: fullTradeFormState,
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

  useEffect(() => {
    dispatch(tradeFormActions.setMarketId(currentMarketId));
  }, [currentMarketId, dispatch]);

  const { summary } = fullTradeFormState;
  const tradeFormInputValues = summary.effectiveTrade;
  const { side } = tradeFormInputValues;
  const selectedOrderSide = side ?? OrderSide.BUY;

  const { selectedTradeType, tradeTypeItems: allTradeTypeItems } = useTradeTypeOptions({
    showAll: true,
    showAssetIcon: true,
  });

  const onTradeTypeChange = (tradeType: TradeFormType) => {
    dispatch(tradeFormActions.resetPrimaryInputs());
    dispatch(tradeFormActions.setOrderType(tradeType));
  };

  const rawInput = useAppSelector(getTradeFormRawState);
  const isInputFilled =
    [
      rawInput.triggerPrice,
      rawInput.limitPrice,
      rawInput.targetLeverage,
      rawInput.reduceOnly,
      rawInput.goodTil,
      rawInput.execution,
      rawInput.postOnly,
      rawInput.timeInForce,
    ].some((v) => v != null && v !== '') || (rawInput.size?.value.value.trim() ?? '') !== '';

  const orderSideAction = {
    [OrderSide.BUY]: ButtonAction.Create,
    [OrderSide.SELL]: ButtonAction.Destroy,
  }[selectedOrderSide];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    switch (currentStep) {
      case MobilePlaceOrderSteps.EditOrder: {
        setCurrentStep?.(MobilePlaceOrderSteps.PreviewOrder);
        break;
      }
      case MobilePlaceOrderSteps.PlacingOrder:
      case MobilePlaceOrderSteps.PlaceOrderFailed:
      case MobilePlaceOrderSteps.Confirmation: {
        onConfirm?.();
        break;
      }
      case MobilePlaceOrderSteps.PreviewOrder:
      default: {
        placeOrder({
          onPlaceOrder: () => {
            dispatch(tradeFormActions.resetPrimaryInputs());
          },
        });
        setCurrentStep?.(MobilePlaceOrderSteps.PlacingOrder);
        break;
      }
    }
  };

  const tabletActionsRow = isTablet && (
    <$TopActionsRow>
      <div tw="inlineRow justify-between gap-0.25 notTablet:hidden">
        <$OrderbookButton
          slotRight={<Icon iconName={IconName.Caret} />}
          onPressedChange={setShowOrderbook}
          isPressed={showOrderbook}
        >
          {!showOrderbook && stringGetter({ key: STRING_KEYS.ORDERBOOK })}
        </$OrderbookButton>
        {/* TODO[TRCL-1411]: add orderbook scale functionality */}
      </div>
      <$ToggleGroup
        items={allTradeTypeItems}
        value={selectedTradeType}
        onValueChange={onTradeTypeChange}
      />
    </$TopActionsRow>
  );

  const orderbookAndInputs = (
    <$OrderbookAndInputs showOrderbook={showOrderbook}>
      {isTablet && showOrderbook && (
        <CanvasOrderbook rowsPerSide={5} hideHeader tw="notTablet:hidden" />
      )}
      <$InputsColumn>
        <TradeFormInputs />
        <TradeSizeInputs />
        <AdvancedTradeOptions />
        <TradeFormMessages
          isErrorShownInOrderStatusToast={isErrorShownInOrderStatusToast}
          placeOrderError={placeOrderError}
          primaryAlert={primaryAlert}
          shouldPromptUserToPlaceLimitOrder={shouldPromptUserToPlaceLimitOrder}
        />
      </$InputsColumn>
    </$OrderbookAndInputs>
  );

  const tradeFooter = (
    <PlaceOrderButtonAndReceipt
      summary={summary}
      actionStringKey={shortAlertKey}
      confirmButtonConfig={{
        stringKey: ORDER_TYPE_STRINGS[selectedTradeType].orderTypeKey,
        buttonTextStringKey: STRING_KEYS.PLACE_ORDER,
        buttonAction: orderSideAction as ButtonAction,
      }}
      currentStep={currentStep}
      hasInput={isInputFilled && (!currentStep || currentStep === MobilePlaceOrderSteps.EditOrder)}
      hasValidationErrors={hasValidationErrors}
      onClearInputs={() => dispatch(tradeFormActions.resetPrimaryInputs())}
      shouldEnableTrade={shouldEnableTrade}
      showDeposit={false}
      tradingUnavailable={tradingUnavailable}
    />
  );

  // prevent real trading if null/zero oracle price or we are out of sync with form state
  if (!hasMarketData) {
    return <LoadingSpace />;
  }

  return (
    <$TradeForm onSubmit={onSubmit} className={className}>
      {currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <>
          <PositionPreview />
          <TradeFormAlertContent
            placeOrderError={placeOrderError}
            isErrorShownInOrderStatusToast={isErrorShownInOrderStatusToast}
            primaryAlert={primaryAlert}
          />
        </>
      ) : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      currentStep && currentStep === MobilePlaceOrderSteps.EditOrder ? (
        <TradeSideTabs
          tw="overflow-visible"
          sharedContent={
            <$Content tw="gap-0.75 shadow-none">
              <$MarginAndLeverageButtons />
              {tabletActionsRow}
              {orderbookAndInputs}
            </$Content>
          }
        />
      ) : (
        <>
          {tabletActionsRow}
          {orderbookAndInputs}
        </>
      )}
      {tradeFooter}
    </$TradeForm>
  );
};

const $TradeForm = styled.form`
  /* Params */
  --tradeBox-content-paddingTop: ;
  --tradeBox-content-paddingRight: ;
  --tradeBox-content-paddingBottom: ;
  --tradeBox-content-paddingLeft: ;

  /* Rules */
  --orderbox-column-width: 180px;
  --orderbox-gap: 1rem;

  min-height: 100%;
  isolation: isolate;

  ${layoutMixins.flexColumn}
  gap: 0.75rem;

  ${layoutMixins.stickyArea1}
  --stickyArea1-background: var(--color-layer-2);
  --stickyArea1-paddingBottom: var(--tradeBox-content-paddingBottom);

  padding: var(--tradeBox-content-paddingTop) var(--tradeBox-content-paddingRight)
    var(--tradeBox-content-paddingBottom) var(--tradeBox-content-paddingLeft);

  @media (min-height: 48rem) {
    ${formMixins.withStickyFooter}
  }

  @media ${breakpoints.tablet} {
    padding-left: 0;
    padding-right: 0;
    margin-left: var(--tradeBox-content-paddingLeft);
    margin-right: var(--tradeBox-content-paddingRight);

    && * {
      outline: none !important;
    }
    @media (min-height: 35rem) {
      ${formMixins.withStickyFooter}
    }
  }
`;

const $Content = styled.div`
  ${layoutMixins.flexColumn}
`;

const $TopActionsRow = styled.div`
  display: grid;
  grid-auto-flow: column;

  @media ${breakpoints.tablet} {
    grid-auto-columns: var(--orderbox-column-width) 1fr;
    gap: var(--orderbox-gap);
  }
`;

const $MarginAndLeverageButtons = styled(MarginAndLeverageButtons)`
  margin-top: 0.75rem;
`;

const $OrderbookButton = styled(ToggleButton)`
  --button-toggle-off-textColor: var(--color-text-1);
  --button-toggle-off-backgroundColor: transparent;

  ${layoutMixins.flexExpandToSpace}

  > svg {
    color: var(--color-text-0);
    height: 0.875em;
    width: 0.875em;

    transition: 0.2s;
  }

  &[data-state='on'] {
    svg {
      rotate: 0.25turn;
    }
  }

  &[data-state='off'] {
    svg {
      rotate: -0.25turn;
    }
  }
`;
const $OrderbookAndInputs = styled.div<{ showOrderbook: boolean }>`
  @media ${breakpoints.tablet} {
    display: grid;
    align-items: flex-start;
    grid-auto-flow: column;

    ${({ showOrderbook }) =>
      showOrderbook
        ? css`
            grid-auto-columns: var(--orderbox-column-width) 1fr;
            gap: var(--orderbox-gap);
          `
        : css`
            grid-auto-columns: 1fr;
            gap: 0;
          `}
  }
`;

const $ToggleGroup = styled(ToggleGroup)`
  button[data-state='off'] {
    gap: 0;
    img {
      display: none;
    }
  }
` as typeof ToggleGroup;

const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;
