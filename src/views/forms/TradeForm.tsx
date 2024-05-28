import { Ref, useCallback, useEffect, useState, type FormEvent } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { NumberFormatValues, SourceInfo } from 'react-number-format';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import {
  ComplianceStatus,
  ErrorType,
  MARGIN_MODE_STRINGS,
  TradeInputErrorAction,
  TradeInputField,
  ValidationError,
  type HumanReadablePlaceOrderPayload,
  type Nullable,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';
import { USD_DECIMALS } from '@/constants/numbers';
import {
  InputErrorData,
  MobilePlaceOrderSteps,
  ORDER_TYPE_STRINGS,
  TradeBoxKeys,
  TradeTypes,
} from '@/constants/trade';

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
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithTooltip } from '@/components/WithTooltip';
import { Orderbook } from '@/views/tables/Orderbook';

import { getCurrentMarketIsolatedPositionLeverage } from '@/state/accountSelectors';
import { openDialog, openDialogInTradeBox } from '@/state/dialogs';
import { setTradeFormInputs } from '@/state/inputs';
import {
  getCurrentInput,
  getInputTradeData,
  getInputTradeOptions,
  getTradeFormInputs,
  useTradeFormData,
} from '@/state/inputsSelectors';
import { getCurrentMarketAssetId, getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSelectedOrderSide, getSelectedTradeType, getTradeInputAlert } from '@/lib/tradeData';

import { AdvancedTradeOptions } from './TradeForm/AdvancedTradeOptions';
import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';
import { PositionPreview } from './TradeForm/PositionPreview';
import { TradeSideToggle } from './TradeForm/TradeSideToggle';
import { TradeSizeInputs } from './TradeForm/TradeSizeInputs';

type TradeBoxInputConfig = {
  key: TradeBoxKeys;
  inputType: InputType;
  label: React.ReactNode;
  onChange: (values: NumberFormatValues, e: SourceInfo) => void;
  ref?: Ref<HTMLInputElement>;
  validationConfig?: InputErrorData;
  value: string | number;
  decimals?: number;
};

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

  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { placeOrder } = useSubaccount();
  const { isTablet } = useBreakpoints();
  const { complianceMessage, complianceStatus } = useComplianceState();

  const {
    price,
    size,
    summary,
    needsLimitPrice,
    needsTargetLeverage,
    needsTrailingPercent,
    needsTriggerPrice,
    executionOptions,
    needsGoodUntil,
    needsPostOnly,
    needsReduceOnly,
    postOnlyTooltip,
    reduceOnlyTooltip,
    timeInForceOptions,
    tradeErrors,
  } = useTradeFormData();

  const currentInput = useSelector(getCurrentInput);
  const currentAssetId = useSelector(getCurrentMarketAssetId);
  const { tickSizeDecimals, stepSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const tradeFormInputValues = useSelector(getTradeFormInputs, shallowEqual);
  const { limitPriceInput, triggerPriceInput, trailingPercentInput } = tradeFormInputValues;

  const currentTradeData = useSelector(getInputTradeData, shallowEqual);

  const { side, type, marginMode, targetLeverage } = currentTradeData ?? {};

  const selectedTradeType = getSelectedTradeType(type);
  const selectedOrderSide = getSelectedOrderSide(side);

  const { typeOptions } = useSelector(getInputTradeOptions, shallowEqual) ?? {};

  const allTradeTypeItems = (typeOptions?.toArray() ?? []).map(
    ({ type: tradeTypeOptionType, stringKey }) => ({
      value: tradeTypeOptionType as TradeTypes,
      label: stringGetter({
        key: stringKey ?? '',
      }),
      slotBefore: <AssetIcon symbol={currentAssetId} />,
    })
  );

  const onTradeTypeChange = (tradeType: TradeTypes) => {
    abacusStateManager.clearTradeInputValues();
    abacusStateManager.setTradeValue({ value: tradeType, field: TradeInputField.type });
  };

  const needsAdvancedOptions =
    !!needsGoodUntil ||
    !!timeInForceOptions ||
    !!executionOptions ||
    !!needsPostOnly ||
    !!postOnlyTooltip ||
    !!needsReduceOnly ||
    !!reduceOnlyTooltip;

  const tradeFormInputs: TradeBoxInputConfig[] = [];

  const isInputFilled =
    Object.values(tradeFormInputValues).some((val) => val !== '') ||
    Object.values(price ?? {}).some((val) => !!val) ||
    [size?.size, size?.usdcSize, size?.leverage].some((val) => val != null);

  const hasInputErrors =
    !!tradeErrors?.some((error: ValidationError) => error.type !== ErrorType.warning) ||
    currentInput !== 'trade';

  let alertContent;
  let alertType = AlertType.Error;

  const inputAlert = getTradeInputAlert({
    abacusInputErrors: tradeErrors ?? [],
    stringGetter,
    stepSizeDecimals,
    tickSizeDecimals,
  });

  const { getNotificationPreferenceForType } = useNotifications();
  const isErrorShownInOrderStatusToast = getNotificationPreferenceForType(
    NotificationType.OrderStatus
  );

  if (placeOrderError && !isErrorShownInOrderStatusToast) {
    alertContent = placeOrderError;
  } else if (inputAlert) {
    alertContent = inputAlert.alertString;
    alertType = inputAlert.type;
  }

  const shouldPromptUserToPlaceLimitOrder = ['MARKET_ORDER_ERROR_ORDERBOOK_SLIPPAGE'].some(
    (errorCode) => inputAlert?.code === errorCode
  );

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

  const currentLeverageForIsolatedPosition = useSelector(getCurrentMarketIsolatedPositionLeverage);

  useEffect(() => {
    if (currentLeverageForIsolatedPosition) {
      abacusStateManager.setTradeValue({
        value: currentLeverageForIsolatedPosition,
        field: TradeInputField.targetLeverage,
      });
    }
  }, [currentLeverageForIsolatedPosition]);

  const { setUnIndexedClientId } = useOnLastOrderIndexed({
    callback: onLastOrderIndexed,
  });

  const onPlaceOrder = () => {
    setPlaceOrderError(undefined);

    placeOrder({
      onError: (errorParams?: { errorStringKey?: Nullable<string> }) => {
        setPlaceOrderError(
          stringGetter({ key: errorParams?.errorStringKey ?? STRING_KEYS.SOMETHING_WENT_WRONG })
        );
        setCurrentStep?.(MobilePlaceOrderSteps.PlaceOrderFailed);
      },
      onSuccess: (placeOrderPayload?: Nullable<HumanReadablePlaceOrderPayload>) => {
        setUnIndexedClientId(placeOrderPayload?.clientId);
      },
    });

    abacusStateManager.clearTradeInputValues({ shouldResetSize: true });
  };

  if (needsTriggerPrice) {
    tradeFormInputs.push({
      key: TradeBoxKeys.TriggerPrice,
      inputType: InputType.Currency,
      label: (
        <>
          <WithTooltip tooltip="trigger-price" side="right">
            {stringGetter({ key: STRING_KEYS.TRIGGER_PRICE })}
          </WithTooltip>
          <Tag>USD</Tag>
        </>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(setTradeFormInputs({ triggerPriceInput: value }));
      },
      value: triggerPriceInput ?? '',
      decimals: tickSizeDecimals ?? USD_DECIMALS,
    });
  }

  if (needsLimitPrice) {
    tradeFormInputs.push({
      key: TradeBoxKeys.LimitPrice,
      inputType: InputType.Currency,
      label: (
        <>
          <WithTooltip tooltip="limit-price" side="right">
            {stringGetter({ key: STRING_KEYS.LIMIT_PRICE })}
          </WithTooltip>
          <Tag>USD</Tag>
        </>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(setTradeFormInputs({ limitPriceInput: value }));
      },
      value: limitPriceInput,
      decimals: tickSizeDecimals ?? USD_DECIMALS,
    });
  }

  if (needsTrailingPercent) {
    tradeFormInputs.push({
      key: TradeBoxKeys.TrailingPercent,
      inputType: InputType.Percent,
      label: (
        <WithTooltip tooltip="trailing-percent" side="right">
          {stringGetter({ key: STRING_KEYS.TRAILING_PERCENT })}
        </WithTooltip>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(setTradeFormInputs({ trailingPercentInput: value }));
      },
      value: trailingPercentInput ?? '',
    });
  }

  return (
    <$TradeForm onSubmit={onSubmit} className={className}>
      {currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <>
          <PositionPreview />
          {alertContent && <AlertMessage type={alertType}>{alertContent}</AlertMessage>}
        </>
      ) : (
        <>
          <$TopActionsRow>
            {isTablet && (
              <>
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
              </>
            )}

            {!isTablet && (
              <>
                <$MarginAndLeverageButtons>
                  <Button
                    onClick={() => {
                      if (isTablet) {
                        dispatch(openDialog({ type: DialogTypes.SelectMarginMode }));
                      } else {
                        dispatch(
                          openDialogInTradeBox({ type: TradeBoxDialogTypes.SelectMarginMode })
                        );
                      }
                    }}
                  >
                    {marginMode &&
                      stringGetter({
                        key: MARGIN_MODE_STRINGS[marginMode.rawValue],
                      })}
                  </Button>

                  {needsTargetLeverage && (
                    <Button
                      onClick={() => {
                        dispatch(openDialog({ type: DialogTypes.AdjustTargetLeverage }));
                      }}
                    >
                      <Output type={OutputType.Multiple} value={targetLeverage} />
                    </Button>
                  )}
                </$MarginAndLeverageButtons>

                <TradeSideToggle />
              </>
            )}
          </$TopActionsRow>

          <$OrderbookAndInputs showOrderbook={showOrderbook}>
            {isTablet && showOrderbook && <$Orderbook maxRowsPerSide={5} />}

            <$InputsColumn>
              {tradeFormInputs.map(
                ({ key, inputType, label, onChange, validationConfig, value, decimals }) => (
                  <FormInput
                    key={key}
                    id={key}
                    type={inputType}
                    label={label}
                    onChange={onChange}
                    validationConfig={validationConfig}
                    value={value}
                    decimals={decimals}
                  />
                )
              )}

              <TradeSizeInputs />

              {needsAdvancedOptions && <AdvancedTradeOptions />}

              {complianceStatus === ComplianceStatus.CLOSE_ONLY && (
                <AlertMessage type={AlertType.Error}>
                  <$Message>{complianceMessage}</$Message>
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
        </>
      )}

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
  --orderbox-column-width: 140px;
  --orderbook-width: calc(var(--orderbox-column-width) + var(--tradeBox-content-paddingLeft));

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
const $MarginAndLeverageButtons = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.5rem;
  margin-right: 0.5rem;

  button {
    width: 100%;
  }
`;
const $TopActionsRow = styled.div`
  display: grid;
  grid-auto-flow: column;

  @media ${breakpoints.tablet} {
    grid-auto-columns: var(--orderbox-column-width) 1fr;
    gap: var(--form-input-gap);
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
            grid-auto-columns: var(--orderbook-width) 1fr;
            gap: var(--form-input-gap);
            margin-left: calc(-1 * var(--tradeBox-content-paddingLeft));
          `
        : css`
            grid-auto-columns: 1fr;
            gap: 0;
          `}
  }
`;
const $Orderbook = styled(Orderbook)`
  width: 100%;

  @media ${breakpoints.notTablet} {
    display: none;
  }

  > table {
    --tableCell-padding: 0.5em 1em;

    scroll-snap-type: none;

    thead {
      display: none;
    }
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
const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;
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
