import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ClosePositionInputField,
  ErrorType,
  ValidationError,
  type HumanReadablePlaceOrderPayload,
  type Nullable,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useIsFirstRender } from '@/hooks/useIsFirstRender';
import { useNotifications } from '@/hooks/useNotifications';
import { useOnLastOrderIndexed } from '@/hooks/useOnLastOrderIndexed';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { breakpoints } from '@/styles';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { PositionPreview } from '@/views/forms/TradeForm/PositionPreview';
import { Orderbook, orderbookMixins, type OrderbookScrollBehavior } from '@/views/tables/Orderbook';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { closeDialog } from '@/state/dialogs';
import { getClosePositionInputErrors, getInputClosePositionData } from '@/state/inputsSelectors';
import { getCurrentMarketConfig, getCurrentMarketId } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { getTradeInputAlert } from '@/lib/tradeData';

import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';

const MAX_KEY = 'MAX';

// Abacus only takes in these percent options
const SIZE_PERCENT_OPTIONS = {
  '25%': 0.25,
  '50%': 0.5,
  '75%': 0.75,
  [MAX_KEY]: 1,
};

type ElementProps = {
  onClosePositionSuccess?: () => void;
  currentStep?: MobilePlaceOrderSteps;
  setCurrentStep?: (step: MobilePlaceOrderSteps) => void;
};

type StyledProps = {
  className?: string;
};

export const ClosePositionForm = ({
  onClosePositionSuccess,
  currentStep,
  setCurrentStep,
  className,
}: ElementProps & StyledProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { isTablet } = useBreakpoints();
  const isFirstRender = useIsFirstRender();

  const [closePositionError, setClosePositionError] = useState<string | undefined>(undefined);

  const { closePosition } = useSubaccount();

  const market = useSelector(getCurrentMarketId);
  const { id } = useSelector(getCurrentMarketAssetData, shallowEqual) || {};
  const { stepSizeDecimals, tickSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) || {};
  const { size: sizeData, summary } = useSelector(getInputClosePositionData, shallowEqual) || {};
  const { size, percent } = sizeData || {};
  const closePositionInputErrors = useSelector(getClosePositionInputErrors, shallowEqual);
  const currentPositionData = useSelector(getCurrentMarketPositionData, shallowEqual);
  const { size: currentPositionSize } = currentPositionData || {};
  const { current: currentSize } = currentPositionSize || {};
  const currentSizeBN = MustBigNumber(currentSize).abs();

  const hasInputErrors = closePositionInputErrors?.some(
    (error: ValidationError) => error.type !== ErrorType.warning
  );

  const inputAlert = getTradeInputAlert({
    abacusInputErrors: closePositionInputErrors ?? [],
    stringGetter,
    stepSizeDecimals,
    tickSizeDecimals,
  });

  const { getNotificationPreferenceForType } = useNotifications();
  const isErrorShownInOrderStatusToast = getNotificationPreferenceForType(
    NotificationType.OrderStatus
  );

  let alertContent;
  let alertType = AlertType.Error;

  if (closePositionError && !isErrorShownInOrderStatusToast) {
    alertContent = closePositionError;
  } else if (inputAlert) {
    alertContent = inputAlert.alertString;
    alertType = inputAlert.type;
  }

  useEffect(() => {
    if (currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder) return;

    abacusStateManager.setClosePositionValue({
      value: market,
      field: ClosePositionInputField.market,
    });

    abacusStateManager.setClosePositionValue({
      value: SIZE_PERCENT_OPTIONS[MAX_KEY],
      field: ClosePositionInputField.percent,
    });
  }, [market, currentStep]);

  const onLastOrderIndexed = useCallback(() => {
    if (!isFirstRender) {
      abacusStateManager.clearClosePositionInputValues({ shouldFocusOnTradeInput: true });
      onClosePositionSuccess?.();

      if (currentStep === MobilePlaceOrderSteps.PlacingOrder) {
        setCurrentStep?.(MobilePlaceOrderSteps.Confirmation);
      }
    }
  }, [currentStep, isFirstRender]);

  const { setUnIndexedClientId } = useOnLastOrderIndexed({
    callback: onLastOrderIndexed,
  });

  const onAmountInput = ({ floatValue }: { floatValue?: number }) => {
    if (currentSize == null) return;

    const closeAmount = MustBigNumber(floatValue)
      .abs()
      .toFixed(stepSizeDecimals || TOKEN_DECIMALS);

    abacusStateManager.setClosePositionValue({
      value: floatValue ? closeAmount : null,
      field: ClosePositionInputField.size,
    });
  };

  const onSelectPercentage = (optionVal: string) => {
    abacusStateManager.setClosePositionValue({
      value: optionVal,
      field: ClosePositionInputField.percent,
    });
  };

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
        dispatch(closeDialog());
        break;
      }
      case MobilePlaceOrderSteps.PreviewOrder:
      default: {
        onClosePosition();
        setCurrentStep?.(MobilePlaceOrderSteps.PlacingOrder);
        break;
      }
    }
  };

  const onClosePosition = () => {
    setClosePositionError(undefined);

    closePosition({
      onError: (errorParams?: { errorStringKey?: Nullable<string> }) => {
        setClosePositionError(
          stringGetter({ key: errorParams?.errorStringKey || STRING_KEYS.SOMETHING_WENT_WRONG })
        );
        setCurrentStep?.(MobilePlaceOrderSteps.PlaceOrderFailed);
      },
      onSuccess: (placeOrderPayload: Nullable<HumanReadablePlaceOrderPayload>) => {
        setUnIndexedClientId(placeOrderPayload?.clientId);
      },
    });

    onClearInputs();
  };

  const onClearInputs = () => {
    abacusStateManager.setClosePositionValue({
      value: null,
      field: ClosePositionInputField.percent,
    });
    abacusStateManager.setClosePositionValue({
      value: null,
      field: ClosePositionInputField.size,
    });
  };

  const alertMessage = alertContent && <AlertMessage type={alertType}>{alertContent}</AlertMessage>;

  const inputs = (
    <$InputsColumn>
      <$FormInput
        id="close-position-amount"
        label={
          <>
            {stringGetter({ key: STRING_KEYS.AMOUNT })}
            {id && <Tag>{id}</Tag>}
          </>
        }
        decimals={stepSizeDecimals || TOKEN_DECIMALS}
        onInput={onAmountInput}
        type={InputType.Number}
        value={size ?? ''}
        max={currentSize !== null ? currentSizeBN.toNumber() : undefined}
      />

      <$ToggleGroup
        items={Object.entries(SIZE_PERCENT_OPTIONS).map(([key, value]) => ({
          label: key === MAX_KEY ? stringGetter({ key: STRING_KEYS.FULL_CLOSE }) : key,
          value: value.toString(),
        }))}
        value={percent?.toString() ?? ''}
        onValueChange={onSelectPercentage}
        shape={ButtonShape.Rectangle}
      />

      {alertMessage}
    </$InputsColumn>
  );

  return (
    <$ClosePositionForm onSubmit={onSubmit} className={className}>
      {!isTablet ? (
        inputs
      ) : currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <$PreviewAndConfirmContent>
          <PositionPreview />
          {alertMessage}
        </$PreviewAndConfirmContent>
      ) : (
        <$MobileLayout>
          <$OrderbookScrollArea scrollBehavior="snapToCenterUnlessHovered">
            <$Orderbook hideHeader />
          </$OrderbookScrollArea>

          <$Right>
            <PositionPreview showNarrowVariation />
            {inputs}
          </$Right>
        </$MobileLayout>
      )}

      <$Footer>
        {size != null && (
          <$ButtonRow>
            <Button
              type={ButtonType.Reset}
              action={ButtonAction.Reset}
              shape={ButtonShape.Pill}
              size={ButtonSize.XSmall}
              onClick={onClearInputs}
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
          confirmButtonConfig={{
            stringKey: STRING_KEYS.CLOSE_ORDER,
            buttonTextStringKey: STRING_KEYS.CLOSE_POSITION,
            buttonAction: ButtonAction.Destroy,
          }}
        />
      </$Footer>
    </$ClosePositionForm>
  );
};
const $ClosePositionForm = styled.form`
  --form-rowGap: 1.25rem;

  min-height: 100%;
  isolation: isolate;

  ${layoutMixins.flexColumn}
  gap: var(--form-rowGap);

  ${layoutMixins.stickyArea1}
  --stickyArea1-background: var(--color-layer-2);
  --stickyArea1-paddingBottom: var(--dialog-content-paddingBottom);

  @media (min-height: 48rem) {
    ${formMixins.withStickyFooter}
  }

  @media ${breakpoints.tablet} {
    --orderbox-column-width: 140px;
    --orderbook-width: calc(var(--orderbox-column-width) + var(--dialog-content-paddingLeft));

    && * {
      outline: none !important;
    }

    @media (min-height: 35rem) {
      ${formMixins.withStickyFooter}
    }
  }
`;

const $PreviewAndConfirmContent = styled.div`
  ${layoutMixins.flexColumn}
  gap: var(--form-input-gap);
`;

const $MobileLayout = styled.div`
  height: 0;
  // Apply dialog's top/left/right padding to inner scroll areas
  min-height: calc(100% + var(--dialog-content-paddingTop) + var(--dialog-content-paddingBottom));
  margin: calc(-1 * var(--dialog-content-paddingTop)) calc(-1 * var(--dialog-content-paddingLeft))
    calc(-1 * var(--form-rowGap)) calc(-1 * var(--dialog-content-paddingRight));

  display: grid;
  grid-template-columns: 3fr 4fr;
  gap: var(--form-input-gap);
`;

const $OrderbookScrollArea = styled.div<{
  scrollBehavior: OrderbookScrollBehavior;
}>`
  ${layoutMixins.stickyLeft}

  ${layoutMixins.scrollArea}
  overscroll-behavior: contain;

  ${layoutMixins.stickyArea0}
  --stickyArea0-paddingTop: calc(-1 * var(--dialog-content-paddingTop));
  --stickyArea0-paddingBottom: calc(-1 * var(--form-rowGap));
  /* --stickyArea0-paddingBottom: 10rem;
  height: calc(100% + 10rem);
  margin-bottom: -10rem;
  padding-bottom: 10rem; */

  ${layoutMixins.contentContainer}

  ${orderbookMixins.scrollArea}

  display: block;
  padding-top: var(--dialog-content-paddingTop);
  padding-bottom: var(--form-rowGap);
`;

const $Orderbook = styled(Orderbook)`
  min-height: 100%;
  --tableCell-padding: 0.5em 1em;
`;

const $Right = styled.div`
  height: 0;
  min-height: 100%;
  ${layoutMixins.scrollArea}

  ${layoutMixins.flexColumn}
  padding-right: var(--dialog-content-paddingRight);

  padding-top: var(--dialog-content-paddingTop);
  padding-bottom: var(--form-rowGap);
  gap: 1rem;
`;

const $FormInput = styled(FormInput)`
  width: 100%;
`;

const $ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}

  @media ${breakpoints.mobile} {
    > :last-child {
      flex-basis: 100%;
    }
  }
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  padding-bottom: var(--dialog-content-paddingBottom);
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);

  ${layoutMixins.column}
`;

const $ButtonRow = styled.div`
  ${layoutMixins.row}
  justify-self: end;
  padding: 0.5rem 0 0.5rem 0;
`;

const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;
