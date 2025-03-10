import { useCallback, useMemo, useState, type FormEvent } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { ComplianceStatus } from '@/bonsai/types/summaryTypes';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import {
  AbacusInputTypes,
  ErrorType,
  TradeInputErrorAction,
  TradeInputField,
  ValidationError,
  type HumanReadablePlaceOrderPayload,
  type Nullable,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
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
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { ToggleButton } from '@/components/ToggleButton';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import {
  getCurrentInput,
  getInputTradeData,
  getTradeFormInputs,
  useTradeFormData,
} from '@/state/inputsSelectors';
import { getCurrentMarketOraclePrice } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { isTruthy } from '@/lib/isTruthy';
import { getSelectedOrderSide, getTradeInputAlert } from '@/lib/tradeData';
import { orEmptyObj } from '@/lib/typeUtils';

import { CanvasOrderbook } from '../CanvasOrderbook/CanvasOrderbook';
import { TradeSideTabs } from '../TradeSideTabs';
import { AdvancedTradeOptions } from './TradeForm/AdvancedTradeOptions';
import { MarginAndLeverageButtons } from './TradeForm/MarginAndLeverageButtons';
import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';
import { PositionPreview } from './TradeForm/PositionPreview';
import { TradeFormInfoMessages } from './TradeForm/TradeFormInfoMessages';
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
  const { tickSizeDecimals, stepSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const oraclePrice = useAppSelector(getCurrentMarketOraclePrice);
  const currentMarketId = useAppSelector(getCurrentMarketId);

  const tradeFormInputValues = useAppSelector(getTradeFormInputs, shallowEqual);

  const currentTradeData = useAppSelector(getInputTradeData, shallowEqual);

  const { marketId, side } = currentTradeData ?? {};

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

  const {
    inputAlert,
    alertContent,
    shortAlertContent,
    alertType,
    shouldPromptUserToPlaceLimitOrder,
  } = useMemo(() => {
    let alertContentInner;
    let alertTypeInner = AlertType.Error;

    let alertContentLink;
    let alertContentLinkText;

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
      alertContentLink = inputAlertInner.link;
      alertContentLinkText = inputAlertInner.linkText;
    }

    const shouldPromptUserToPlaceLimitOrderInner = ['MARKET_ORDER_ERROR_ORDERBOOK_SLIPPAGE'].some(
      (errorCode) => inputAlertInner?.code === errorCode
    );
    return {
      shortAlertContent: alertContentInner,
      alertContent: alertContentInner && (
        <div tw="inline-block">
          {alertContentInner}{' '}
          {alertContentLinkText && alertContentLink && (
            <Link isInline href={alertContentLink}>
              {alertContentLinkText}
            </Link>
          )}
        </div>
      ),
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
        setCurrentStep?.(MobilePlaceOrderSteps.PlaceOrderFailed);
      },
      onSuccess: (placeOrderPayload?: Nullable<HumanReadablePlaceOrderPayload>) => {
        setUnIndexedClientId(placeOrderPayload?.clientId);
      },
    });

    abacusStateManager.clearTradeInputValues({ shouldResetSize: true });
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

  const tradeFormMessages = (
    <>
      <TradeFormInfoMessages marketId={marketId} />

      {complianceStatus === ComplianceStatus.CLOSE_ONLY && (
        <AlertMessage type={AlertType.Error}>
          <span>{complianceMessage}</span>
        </AlertMessage>
      )}

      {alertContent && (
        <AlertMessage type={alertType}>
          <div tw="row gap-0.75">
            {alertContent}
            {shouldPromptUserToPlaceLimitOrder && (
              <$IconButton
                iconName={IconName.Arrow}
                shape={ButtonShape.Circle}
                action={ButtonAction.Navigation}
                size={ButtonSize.XSmall}
                iconSize="1.25em"
                onClick={() => onTradeTypeChange(TradeTypes.LIMIT)}
              />
            )}
          </div>
        </AlertMessage>
      )}
    </>
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
        {tradeFormMessages}
      </$InputsColumn>
    </$OrderbookAndInputs>
  );

  const tradeFooter = (
    <PlaceOrderButtonAndReceipt
      hasValidationErrors={hasInputErrors}
      hasInput={isInputFilled && (!currentStep || currentStep === MobilePlaceOrderSteps.EditOrder)}
      onClearInputs={() => abacusStateManager.clearTradeInputValues({ shouldResetSize: true })}
      actionStringKey={inputAlert?.actionStringKey}
      validationErrorString={shortAlertContent}
      summary={summary ?? undefined}
      currentStep={currentStep}
      showDeposit={inputAlert?.errorAction === TradeInputErrorAction.DEPOSIT}
      confirmButtonConfig={{
        stringKey: ORDER_TYPE_STRINGS[selectedTradeType].orderTypeKey,
        buttonTextStringKey: STRING_KEYS.PLACE_ORDER,
        buttonAction: orderSideAction as ButtonAction,
      }}
    />
  );

  // prevent real trading if null/zero oracle price or we are out of sync with abacus somehow
  if (!isTruthy(oraclePrice) || currentMarketId !== marketId) {
    return <LoadingSpace />;
  }

  return (
    <$TradeForm onSubmit={onSubmit} className={className}>
      {currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <>
          <PositionPreview />
          {alertContent && <AlertMessage type={alertType}>{alertContent}</AlertMessage>}
        </>
      ) : currentStep && currentStep === MobilePlaceOrderSteps.EditOrder ? (
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

const $IconButton = styled(IconButton)`
  --button-backgroundColor: var(--color-white-faded);
  flex-shrink: 0;
`;

const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;
