import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import {
  AbacusOrderType,
  ClosePositionInputField,
  ErrorType,
  ValidationError,
  type HumanReadablePlaceOrderPayload,
  type Nullable,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { ErrorParams } from '@/constants/errors';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { StatsigFlags } from '@/constants/statsig';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useIsFirstRender } from '@/hooks/useIsFirstRender';
import { useNotifications } from '@/hooks/useNotifications';
import { useOnLastOrderIndexed } from '@/hooks/useOnLastOrderIndexed';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Collapsible } from '@/components/Collapsible';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithTooltip } from '@/components/WithTooltip';
import { PositionPreview } from '@/views/forms/TradeForm/PositionPreview';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { closeDialog } from '@/state/dialogs';
import { getClosePositionInputErrors, getInputClosePositionData } from '@/state/inputsSelectors';
import {
  getCurrentMarketConfig,
  getCurrentMarketId,
  getCurrentMarketMidMarketPrice,
} from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { testFlags } from '@/lib/testFlags';
import { getTradeInputAlert } from '@/lib/tradeData';

import { CanvasOrderbook } from '../CanvasOrderbook/CanvasOrderbook';
import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';

const MAX_KEY = 'MAX';

const SIZE_PERCENT_OPTIONS = {
  '10%': 0.1,
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
  const dispatch = useAppDispatch();
  const { isTablet } = useBreakpoints();
  const isFirstRender = useIsFirstRender();
  const enableLimitClose = useStatsigGateValue(StatsigFlags.ffEnableLimitClose);

  const [closePositionError, setClosePositionError] = useState<string | undefined>(undefined);

  const { closePosition } = useSubaccount();

  const market = useAppSelector(getCurrentMarketId);
  const { id } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { stepSizeDecimals, tickSizeDecimals } =
    useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const {
    size: sizeData,
    price,
    type,
    summary,
  } = useAppSelector(getInputClosePositionData, shallowEqual) ?? {};

  const { size, percent } = sizeData ?? {};
  const { limitPrice } = price ?? {};
  const useLimit = type === AbacusOrderType.Limit;

  const closePositionInputErrors = useAppSelector(getClosePositionInputErrors, shallowEqual);
  const currentPositionData = useAppSelector(getCurrentMarketPositionData, shallowEqual);
  const { size: currentPositionSize } = currentPositionData ?? {};
  const { current: currentSize } = currentPositionSize ?? {};
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

  let alertContentLink;
  let alertContentLinkText;

  if (closePositionError && !isErrorShownInOrderStatusToast) {
    alertContent = closePositionError;
  } else if (inputAlert) {
    alertContent = inputAlert.alertString;
    alertType = inputAlert.type;
    alertContentLink = inputAlert.link;
    alertContentLinkText = inputAlert.linkText;
  }

  useEffect(() => {
    if (currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder) return;

    abacusStateManager.setClosePositionValue({
      value: market,
      field: ClosePositionInputField.market,
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
      .toFixed(stepSizeDecimals ?? TOKEN_DECIMALS);

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
      onError: (errorParams: ErrorParams) => {
        setClosePositionError(
          stringGetter({
            key: errorParams.errorStringKey,
            fallback: errorParams.errorMessage ?? '',
          })
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

  const midMarketPrice = useAppSelector(getCurrentMarketMidMarketPrice, shallowEqual);

  const setLimitPriceToMidPrice = useCallback(() => {
    if (!midMarketPrice) return;
    abacusStateManager.setClosePositionValue({
      value: MustBigNumber(midMarketPrice).toFixed(tickSizeDecimals ?? USD_DECIMALS),
      field: ClosePositionInputField.limitPrice,
    });
  }, [midMarketPrice, tickSizeDecimals]);

  const midMarketPriceButton = (
    <$MidPriceButton onClick={setLimitPriceToMidPrice} size={ButtonSize.XSmall}>
      {stringGetter({ key: STRING_KEYS.MID_MARKET_PRICE_SHORT })}
    </$MidPriceButton>
  );

  const onLimitPriceInput = ({ value }: NumberFormatValues) => {
    abacusStateManager.setClosePositionValue({
      value,
      field: ClosePositionInputField.limitPrice,
    });
  };

  const onUseLimitCheckedChange = (checked: Boolean) => {
    abacusStateManager.setClosePositionValue({
      value: checked,
      field: ClosePositionInputField.useLimit,
    });
  };

  const alertMessage = alertContent && (
    <AlertMessage type={alertType}>
      <div tw="inline-block">
        {alertContent}{' '}
        {alertContentLinkText && alertContentLink && (
          <Link isInline href={alertContentLink}>
            {alertContentLinkText}
          </Link>
        )}
      </div>
    </AlertMessage>
  );

  const inputs = (
    <$InputsColumn>
      <FormInput
        id="close-position-amount"
        label={
          <>
            {stringGetter({ key: STRING_KEYS.AMOUNT })}
            {id && <Tag>{id}</Tag>}
          </>
        }
        decimals={stepSizeDecimals ?? TOKEN_DECIMALS}
        onInput={onAmountInput}
        type={InputType.Number}
        value={size ?? ''}
        max={currentSize !== null ? currentSizeBN.toNumber() : undefined}
        tw="w-full"
      />

      <$ToggleGroup
        items={objectEntries(SIZE_PERCENT_OPTIONS).map(([key, value]) => ({
          label: key === MAX_KEY ? stringGetter({ key: STRING_KEYS.FULL_CLOSE }) : key,
          value: value.toString(),
        }))}
        value={percent?.toString() ?? ''}
        onValueChange={onSelectPercentage}
        shape={ButtonShape.Rectangle}
      />

      {(enableLimitClose || testFlags.showLimitClose) && (
        <Collapsible
          slotTrigger={
            <Checkbox
              checked={useLimit}
              onCheckedChange={onUseLimitCheckedChange}
              id="limit-close"
              label="Limit Close (dev-only)"
              tw="my-0.25"
            />
          }
          open={useLimit}
        >
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
            value={limitPrice ?? ''}
            decimals={tickSizeDecimals ?? USD_DECIMALS}
            slotRight={midMarketPrice ? midMarketPriceButton : undefined}
          />
        </Collapsible>
      )}

      {alertMessage}
    </$InputsColumn>
  );

  return (
    <$ClosePositionForm onSubmit={onSubmit} className={className}>
      {!isTablet ? (
        inputs
      ) : currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <div tw="flexColumn gap-[--form-input-gap]">
          <PositionPreview />
          {alertMessage}
        </div>
      ) : (
        <$MobileLayout>
          <$OrderbookContainer>
            <CanvasOrderbook hideHeader tw="min-h-full" />
          </$OrderbookContainer>

          <$Right>
            <PositionPreview showNarrowVariation />
            {inputs}
          </$Right>
        </$MobileLayout>
      )}

      <$Footer>
        {size != null && (
          <div tw="row justify-self-end px-0 py-0.5">
            <Button
              type={ButtonType.Reset}
              action={ButtonAction.Reset}
              shape={ButtonShape.Pill}
              size={ButtonSize.XSmall}
              onClick={onClearInputs}
            >
              {stringGetter({ key: STRING_KEYS.CLEAR })}
            </Button>
          </div>
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

const $OrderbookContainer = styled.div`
  display: flex;
  min-height: 100%;
  padding-top: var(--dialog-content-paddingTop);
  padding-bottom: var(--form-rowGap);
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
const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;

const $MidPriceButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;
