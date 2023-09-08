import { type FormEvent, useState, useEffect, Ref } from 'react';
import styled, { AnyStyledComponent, css } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';
import type { NumberFormatValues, SourceInfo } from 'react-number-format';

import { AlertType } from '@/constants/alerts';

import {
  ErrorType,
  TradeInputErrorAction,
  TradeInputField,
  ValidationError,
} from '@/constants/abacus';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { InputErrorData, TradeBoxKeys, MobilePlaceOrderSteps } from '@/constants/trade';

import { breakpoints } from '@/styles';
import { useStringGetter, useSubaccount } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';
import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithTooltip } from '@/components/WithTooltip';

import { Orderbook } from '@/views/tables/Orderbook';

import { calculateHasUncommittedOrders } from '@/state/accountSelectors';
import { getCurrentInput, useTradeFormData } from '@/state/inputsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getTradeInputAlert } from '@/lib/tradeData';

import { AdvancedTradeOptions } from './TradeForm/AdvancedTradeOptions';
import { TradeSizeInputs } from './TradeForm/TradeSizeInputs';
import { TradeSideToggle } from './TradeForm/TradeSideToggle';
import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';
import { PositionPreview } from './TradeForm/PositionPreview';

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
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState<string>();
  const [showOrderbook, setShowOrderbook] = useState(false);

  const stringGetter = useStringGetter();
  const { placeOrder } = useSubaccount();

  const {
    price,
    size,
    summary,
    needsLimitPrice,
    needsTrailingPercent,
    needsTriggerPrice,
    executionOptions,
    needsGoodUntil,
    needsPostOnly,
    needsReduceOnly,
    timeInForceOptions,
    tradeErrors,
  } = useTradeFormData();

  const { limitPrice, triggerPrice, trailingPercent } = price || {};
  const hasUncommittedOrders = useSelector(calculateHasUncommittedOrders);
  const currentInput = useSelector(getCurrentInput);
  const { tickSizeDecimals, stepSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) || {};

  const needsAdvancedOptions =
    needsGoodUntil || timeInForceOptions || executionOptions || needsPostOnly || needsReduceOnly;

  const tradeFormInputs: TradeBoxInputConfig[] = [];

  const isInputFilled =
    Object.values(price || {}).some((val) => val != null) ||
    [size?.size, size?.usdcSize, size?.leverage].some((val) => val != null);

  const hasInputErrors =
    tradeErrors?.some((error: ValidationError) => error.type !== ErrorType.warning) ||
    currentInput !== 'trade';

  let alertContent;
  let alertType = AlertType.Error;

  const inputAlert = getTradeInputAlert({
    abacusInputErrors: tradeErrors ?? [],
    stringGetter,
    stepSizeDecimals,
    tickSizeDecimals,
  });

  if (placeOrderError) {
    alertContent = placeOrderError;
  } else if (inputAlert) {
    alertContent = inputAlert?.alertString;
    alertType = inputAlert?.type;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    switch (currentStep) {
      case MobilePlaceOrderSteps.EditOrder: {
        setCurrentStep?.(MobilePlaceOrderSteps.PreviewOrder);
        break;
      }
      case MobilePlaceOrderSteps.PlacingOrder:
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

  useEffect(() => {
    // order has been placed
    if (
      (!currentStep || currentStep === MobilePlaceOrderSteps.PlacingOrder) &&
      !hasUncommittedOrders
    ) {
      setIsPlacingOrder(false);
      abacusStateManager.clearTradeInputValues({ shouldResetSize: true });
      setCurrentStep?.(MobilePlaceOrderSteps.Confirmation);
    }
  }, [currentStep, hasUncommittedOrders]);

  const onPlaceOrder = async () => {
    setPlaceOrderError(undefined);
    setIsPlacingOrder(true);

    await placeOrder({
      onError: (errorParams?: { errorStringKey?: string }) => {
        setPlaceOrderError(
          stringGetter({ key: errorParams?.errorStringKey || STRING_KEYS.SOMETHING_WENT_WRONG })
        );

        setIsPlacingOrder(false);
      },
    });
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
      onChange: ({ floatValue }: NumberFormatValues) => {
        abacusStateManager.setTradeValue({
          value: floatValue,
          field: TradeInputField.triggerPrice,
        });
      },
      value: triggerPrice ?? '',
      decimals: tickSizeDecimals || USD_DECIMALS,
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
      onChange: ({ floatValue }: NumberFormatValues) => {
        abacusStateManager.setTradeValue({ value: floatValue, field: TradeInputField.limitPrice });
      },
      value: limitPrice ?? '',
      decimals: tickSizeDecimals || USD_DECIMALS,
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
      onChange: ({ floatValue }: NumberFormatValues) => {
        abacusStateManager.setTradeValue({
          value: floatValue,
          field: TradeInputField.trailingPercent,
        });
      },
      value: trailingPercent ?? '',
    });
  }

  return (
    <Styled.TradeForm onSubmit={onSubmit} className={className}>
      {currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <>
          <PositionPreview />
          {alertContent && <AlertMessage type={alertType}>{alertContent}</AlertMessage>}
        </>
      ) : (
        <>
          <Styled.TopActionsRow>
            <Styled.OrderbookButtons>
              <Styled.OrderbookButton
                slotRight={<Icon iconName={IconName.Caret} />}
                onPressedChange={setShowOrderbook}
                isPressed={showOrderbook}
                hidePressedStyle
              >
                {!showOrderbook && stringGetter({ key: STRING_KEYS.ORDERBOOK })}
              </Styled.OrderbookButton>
              {/* TODO[TRCL-1411]: add orderbook scale functionality */}
            </Styled.OrderbookButtons>

            <TradeSideToggle />
          </Styled.TopActionsRow>

          <Styled.OrderbookAndInputs showOrderbook={showOrderbook}>
            {showOrderbook && <Styled.Orderbook maxRowsPerSide={5} selectionBehavior="replace" />}

            <Styled.InputsColumn>
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

              {alertContent && <AlertMessage type={alertType}>{alertContent}</AlertMessage>}
            </Styled.InputsColumn>
          </Styled.OrderbookAndInputs>
        </>
      )}

      <Styled.Footer>
        {isInputFilled && (!currentStep || currentStep === MobilePlaceOrderSteps.EditOrder) && (
          <Styled.ButtonRow>
            <Button
              type={ButtonType.Reset}
              action={ButtonAction.Reset}
              shape={ButtonShape.Pill}
              size={ButtonSize.XSmall}
              onClick={() => abacusStateManager.clearTradeInputValues({ shouldResetSize: true })}
            >
              {stringGetter({ key: STRING_KEYS.CLEAR })}
            </Button>
          </Styled.ButtonRow>
        )}
        <PlaceOrderButtonAndReceipt
          isLoading={isPlacingOrder}
          hasValidationErrors={hasInputErrors}
          actionStringKey={inputAlert?.actionStringKey}
          summary={summary ?? undefined}
          currentStep={currentStep}
          showDeposit={inputAlert?.errorAction === TradeInputErrorAction.DEPOSIT}
          showConnectWallet={inputAlert?.errorAction === TradeInputErrorAction.CONNECT_WALLET}
        />
      </Styled.Footer>
    </Styled.TradeForm>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TradeForm = styled.form`
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

  @media ${breakpoints.tablet} {
    padding-left: 0;
    padding-right: 0;
    margin-left: var(--tradeBox-content-paddingLeft);
    margin-right: var(--tradeBox-content-paddingRight);

    && * {
      outline: none !important;
    }
  }
`;

Styled.TopActionsRow = styled.div`
  display: grid;
  grid-auto-flow: column;

  @media ${breakpoints.tablet} {
    grid-auto-columns: var(--orderbox-column-width) 1fr;
    gap: var(--form-input-gap);
  }
`;

Styled.OrderbookButtons = styled.div`
  ${layoutMixins.inlineRow}
  justify-content: space-between;
  gap: 0.25rem;

  @media ${breakpoints.notTablet} {
    display: none;
  }
`;

Styled.OrderbookButton = styled(ToggleButton)`
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

Styled.OrderbookAndInputs = styled.div<{ showOrderbook: boolean }>`
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

Styled.Orderbook = styled(Orderbook)`
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

Styled.InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;

Styled.ButtonRow = styled.div`
  ${layoutMixins.row}
  justify-self: end;
  padding: 0.5rem 0 0.5rem 0;
`;

Styled.Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  backdrop-filter: none;

  ${layoutMixins.column}
  ${layoutMixins.noPointerEvents}
  margin-top: auto;
`;
