import { useCallback, useMemo, useState, type FormEvent } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import {
  AbacusInputTypes,
  ComplianceStatus,
  ErrorType,
  TradeInputErrorAction,
  TradeInputField,
  ValidationError,
  type HumanReadablePlaceOrderPayload,
  type Nullable,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { ErrorParams } from '@/constants/errors';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';
import { MobilePlaceOrderSteps, ORDER_TYPE_STRINGS, TradeTypes } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useNotifications } from '@/hooks/useNotifications';
import { useOnLastOrderIndexed } from '@/hooks/useOnLastOrderIndexed';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ToggleButton } from '@/components/ToggleButton';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppSelector } from '@/state/appTypes';
import {
  getCurrentInput,
  getInputTradeData,
  getTradeFormInputs,
  useTradeFormData,
} from '@/state/inputsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSelectedOrderSide, getTradeInputAlert } from '@/lib/tradeData';

import { CanvasOrderbook } from '../CanvasOrderbook/CanvasOrderbook';
import { AdvancedTradeOptions } from './TradeForm/AdvancedTradeOptions';
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
  const [placeOrderError, setPlaceOrderError] = useState<string>();
  const [showOrderbook, setShowOrderbook] = useState(false);

  const stringGetter = useStringGetter();
  const { placeOrder } = useSubaccount();
  const { isTablet } = useBreakpoints();
  const { complianceMessage, complianceStatus } = useComplianceState();

  const { price, size, summary, tradeErrors } = useTradeFormData();

  const currentInput = useAppSelector(getCurrentInput);
  const { tickSizeDecimals, stepSizeDecimals } =
    useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const tradeFormInputValues = useAppSelector(getTradeFormInputs, shallowEqual);

  const currentTradeData = useAppSelector(getInputTradeData, shallowEqual);

  const { side } = currentTradeData ?? {};

  const selectedOrderSide = getSelectedOrderSide(side);

  const { selectedTradeType, tradeTypeItems: allTradeTypeItems } = useTradeTypeOptions({
    showAll: true,
    showAssetIcon: true,
  });

  const onTradeTypeChange = (tradeType: TradeTypes) => {
    abacusStateManager.clearTradeInputValues();
    abacusStateManager.setTradeValue({ value: tradeType, field: TradeInputField.type });
  };

  const isInputFilled =
    Object.values(tradeFormInputValues).some((val) => val !== '') ||
    Object.values(price ?? {}).some((val) => !!val) ||
    [size?.size, size?.usdcSize, size?.leverage].some((val) => val != null);

  const hasInputErrors =
    !!tradeErrors?.some((error: ValidationError) => error.type !== ErrorType.warning) ||
    currentInput !== AbacusInputTypes.Trade;

  const { getNotificationPreferenceForType } = useNotifications();

  const { inputAlert, alertContent, alertType, shouldPromptUserToPlaceLimitOrder } = useMemo(() => {
    let alertContentInner;
    let alertTypeInner = AlertType.Error;

    const inputAlertInner = getTradeInputAlert({
      abacusInputErrors: tradeErrors ?? [],
      stringGetter,
      stepSizeDecimals,
      tickSizeDecimals,
    });

    const isErrorShownInOrderStatusToast = getNotificationPreferenceForType(
      NotificationType.OrderStatus
    );

    if (placeOrderError && !isErrorShownInOrderStatusToast) {
      alertContentInner = placeOrderError;
    } else if (inputAlertInner) {
      alertContentInner = inputAlertInner.alertString;
      alertTypeInner = inputAlertInner.type;
    }

    const shouldPromptUserToPlaceLimitOrderInner = ['MARKET_ORDER_ERROR_ORDERBOOK_SLIPPAGE'].some(
      (errorCode) => inputAlertInner?.code === errorCode
    );
    return {
      alertContent: alertContentInner,
      alertType: alertTypeInner,
      shouldPromptUserToPlaceLimitOrder: shouldPromptUserToPlaceLimitOrderInner,
      inputAlert: inputAlertInner,
    };
  }, [
    getNotificationPreferenceForType,
    placeOrderError,
    stepSizeDecimals,
    stringGetter,
    tickSizeDecimals,
    tradeErrors,
  ]);

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
        onPlaceOrder();
        setCurrentStep?.(MobilePlaceOrderSteps.PlacingOrder);
        break;
      }
    }
  };

  const onLastOrderIndexed = useCallback(() => {
    if (currentStep === MobilePlaceOrderSteps.PlacingOrder) {
      setCurrentStep?.(MobilePlaceOrderSteps.Confirmation);
    }
  }, [currentStep, setCurrentStep]);

  const { setUnIndexedClientId } = useOnLastOrderIndexed({
    callback: onLastOrderIndexed,
  });

  const onPlaceOrder = () => {
    setPlaceOrderError(undefined);

    placeOrder({
      onError: (errorParams: ErrorParams) => {
        setPlaceOrderError(
          stringGetter({
            key: errorParams.errorStringKey,
            fallback: errorParams.errorMessage ?? '',
          })
        );
      },
      onSuccess: (placeOrderPayload?: Nullable<HumanReadablePlaceOrderPayload>) => {
        setUnIndexedClientId(placeOrderPayload?.clientId);
      },
    });

    abacusStateManager.clearTradeInputValues({ shouldResetSize: true });
  };

  const tabletActionsRow = isTablet && (
    <$TopActionsRow>
      <$OrderbookButtons>
        <$OrderbookButton
          slotRight={<Icon iconName={IconName.Caret} />}
          onPressedChange={setShowOrderbook}
          isPressed={showOrderbook}
        >
          {!showOrderbook && stringGetter({ key: STRING_KEYS.ORDERBOOK })}
        </$OrderbookButton>
        {/* TODO[TRCL-1411]: add orderbook scale functionality */}
      </$OrderbookButtons>

      <$ToggleGroup
        items={allTradeTypeItems}
        value={selectedTradeType}
        onValueChange={onTradeTypeChange}
      />
    </$TopActionsRow>
  );

  const orderbookAndInputs = (
    <$OrderbookAndInputs showOrderbook={showOrderbook}>
      {isTablet && showOrderbook && <$Orderbook rowsPerSide={5} hideHeader />}
      <$InputsColumn>
        <TradeFormInputs />
        <TradeSizeInputs />
        <AdvancedTradeOptions />

        {complianceStatus === ComplianceStatus.CLOSE_ONLY && (
          <AlertMessage type={AlertType.Error}>
            <span>{complianceMessage}</span>
          </AlertMessage>
        )}

        {alertContent && (
          <AlertMessage type={alertType}>
            <$Message>
              {alertContent}
              {shouldPromptUserToPlaceLimitOrder && (
                <$IconButton
                  iconName={IconName.Arrow}
                  shape={ButtonShape.Circle}
                  action={ButtonAction.Navigation}
                  size={ButtonSize.XSmall}
                  onClick={() => onTradeTypeChange(TradeTypes.LIMIT)}
                />
              )}
            </$Message>
          </AlertMessage>
        )}
      </$InputsColumn>
    </$OrderbookAndInputs>
  );

  const tradeFooter = (
    <$Footer>
      {isInputFilled && (!currentStep || currentStep === MobilePlaceOrderSteps.EditOrder) && (
        <$ButtonRow>
          <Button
            type={ButtonType.Reset}
            action={ButtonAction.Reset}
            shape={ButtonShape.Pill}
            size={ButtonSize.XSmall}
            onClick={() => abacusStateManager.clearTradeInputValues({ shouldResetSize: true })}
          >
            {stringGetter({ key: STRING_KEYS.CLEAR })}
          </Button>
        </$ButtonRow>
      )}
      <PlaceOrderButtonAndReceipt
        hasValidationErrors={hasInputErrors}
        actionStringKey={inputAlert?.actionStringKey}
        validationErrorString={alertContent}
        summary={summary ?? undefined}
        currentStep={currentStep}
        showDeposit={inputAlert?.errorAction === TradeInputErrorAction.DEPOSIT}
        confirmButtonConfig={{
          stringKey: ORDER_TYPE_STRINGS[selectedTradeType].orderTypeKey,
          buttonTextStringKey: STRING_KEYS.PLACE_ORDER,
          buttonAction: orderSideAction,
        }}
      />
    </$Footer>
  );

  return (
    <$TradeForm onSubmit={onSubmit} className={className}>
      {currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <>
          <PositionPreview />
          {alertContent && <AlertMessage type={alertType}>{alertContent}</AlertMessage>}
        </>
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

const $TopActionsRow = styled.div`
  display: grid;
  grid-auto-flow: column;

  @media ${breakpoints.tablet} {
    grid-auto-columns: var(--orderbox-column-width) 1fr;
    gap: var(--orderbox-gap);
  }
`;
const $OrderbookButtons = styled.div`
  ${layoutMixins.inlineRow}
  justify-content: space-between;
  gap: 0.25rem;

  @media ${breakpoints.notTablet} {
    display: none;
  }
`;
const $OrderbookButton = styled(ToggleButton)`
  --button-toggle-off-textColor: var(--color-text-1);
  --button-toggle-off-backgroundColor: transparent;

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
const $Orderbook = styled(CanvasOrderbook)`
  @media ${breakpoints.notTablet} {
    display: none;
  }
`;
const $ToggleGroup = styled(ToggleGroup)`
  overflow-x: auto;

  button[data-state='off'] {
    gap: 0;

    img {
      height: 0;
    }
  }
` as typeof ToggleGroup;

const $Message = styled.div`
  ${layoutMixins.row}
  gap: 0.75rem;
`;

const $IconButton = styled(IconButton)`
  --button-backgroundColor: var(--color-white-faded);
  flex-shrink: 0;

  svg {
    width: 1.25em;
    height: 1.25em;
  }
`;

const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;

const $ButtonRow = styled.div`
  ${layoutMixins.row}
  justify-self: end;
  padding: 0.5rem 0 0.5rem 0;
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--tradeBox-content-paddingBottom);

  ${layoutMixins.column}
`;
