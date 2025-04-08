import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { OrderSizeInputs, TradeFormType } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { type HumanReadablePlaceOrderPayload, type Nullable } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { ErrorParams } from '@/constants/errors';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { StatsigFlags } from '@/constants/statsig';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useClosePositionFormInputs } from '@/hooks/useClosePositionFormInputs';
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
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithTooltip } from '@/components/WithTooltip';
import { PositionPreview } from '@/views/forms/TradeForm/PositionPreview';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closePositionFormActions } from '@/state/closePositionForm';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';
import { closeDialog } from '@/state/dialogs';
import {
  getClosePositionFormSummary,
  getClosePositionFormValues,
} from '@/state/tradeFormSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';
import { getTradeInputAlert } from '@/lib/tradeData';
import { orEmptyObj } from '@/lib/typeUtils';

import { CanvasOrderbook } from '../CanvasOrderbook/CanvasOrderbook';
import { MarketLeverageInput } from './TradeForm/MarketLeverageInput';
import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';

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

  const market = useAppSelector(getCurrentMarketIdIfTradeable);
  const id = useAppSelector(BonsaiHelpers.currentMarket.assetId);

  const { stepSizeDecimals, tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const tradeValues = useAppSelector(getClosePositionFormValues);
  const { type } = tradeValues;
  const summary = useAppSelector(getClosePositionFormSummary);
  const useLimit = type === TradeFormType.LIMIT;
  const effectiveSizes = summary.summary.tradeInfo.inputSummary.size;

  const {
    amountInput,
    onAmountInput,
    setLimitPriceToMidPrice,
    limitPriceInput,
    onLimitPriceInput,
  } = useClosePositionFormInputs();

  const currentPositionData = useAppSelector(getCurrentMarketPositionData, shallowEqual);
  const { signedSize: currentPositionSize } = currentPositionData ?? {};
  const currentSizeBN = MustBigNumber(currentPositionSize).abs();

  const hasInputErrors = false; // todo

  const inputAlert = getTradeInputAlert({
    abacusInputErrors: [], // todo
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
    if (!isFirstRender) {
      dispatch(closePositionFormActions.setOrderType(TradeFormType.MARKET));
      dispatch(closePositionFormActions.reset());
      dispatch(closePositionFormActions.setSizeAvailablePercent('1'));
      onClosePositionSuccess?.();

      if (currentStep === MobilePlaceOrderSteps.PlacingOrder) {
        setCurrentStep?.(MobilePlaceOrderSteps.Confirmation);
      }
    }
  }, [currentStep, dispatch, isFirstRender, onClosePositionSuccess, setCurrentStep]);

  const { setUnIndexedClientId } = useOnLastOrderIndexed({
    callback: onLastOrderIndexed,
  });

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

  const onUseLimitCheckedChange = (checked: boolean) => {
    dispatch(
      closePositionFormActions.setOrderType(checked ? TradeFormType.LIMIT : TradeFormType.MARKET)
    );
  };

  const onClearInputs = () => {
    dispatch(closePositionFormActions.setOrderType(TradeFormType.MARKET));
    dispatch(closePositionFormActions.reset());
  };

  const midMarketPriceButton = (
    <$MidPriceButton onClick={setLimitPriceToMidPrice} size={ButtonSize.XSmall}>
      {stringGetter({ key: STRING_KEYS.MID_MARKET_PRICE_SHORT })}
    </$MidPriceButton>
  );

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
            <span>{stringGetter({ key: STRING_KEYS.AMOUNT })}</span>
            {id && <Tag>{id}</Tag>}
          </>
        }
        decimals={stepSizeDecimals ?? TOKEN_DECIMALS}
        onInput={onAmountInput}
        type={InputType.Number}
        value={amountInput}
        max={currentPositionSize != null ? currentSizeBN.toNumber() : undefined}
        tw="w-full"
      />

      <MarketLeverageInput
        leftLeverage={summary.summary.tradeInfo.minimumSignedLeverage}
        rightLeverage={summary.summary.tradeInfo.maximumSignedLeverage}
        leverageInputValue={
          tradeValues.size != null && OrderSizeInputs.is.SIGNED_POSITION_LEVERAGE(tradeValues.size)
            ? tradeValues.size.value.value
            : effectiveSizes?.leverageSigned != null
              ? MustBigNumber(effectiveSizes.leverageSigned).toString(10)
              : MustBigNumber(summary.summary.tradeInfo.minimumSignedLeverage).toString(10)
        }
        setLeverageInputValue={(value: string) => {
          dispatch(closePositionFormActions.setSizeLeverageSigned(value));
        }}
      />

      {(enableLimitClose || testFlags.showLimitClose) && (
        <Collapsible
          slotTrigger={
            <Checkbox
              checked={useLimit}
              onCheckedChange={onUseLimitCheckedChange}
              id="limit-close"
              label={
                <WithTooltip tooltip="limit-close" side="right">
                  {stringGetter({ key: STRING_KEYS.LIMIT_CLOSE })}
                </WithTooltip>
              }
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
            value={limitPriceInput}
            decimals={tickSizeDecimals ?? USD_DECIMALS}
            slotRight={setLimitPriceToMidPrice ? midMarketPriceButton : undefined}
          />
        </Collapsible>
      )}

      {alertMessage}
    </$InputsColumn>
  );

  const [showOrderbook, setShowOrderbook] = useState(false);
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
        <$MobileLayout $showOrderbook={showOrderbook}>
          {showOrderbook && (
            <$OrderbookContainer>
              <CanvasOrderbook hideHeader tw="min-h-full" rowsPerSide={15} />
            </$OrderbookContainer>
          )}

          <$Right>
            <PositionPreview showNarrowVariation />
            <$OrderbookButton
              slotRight={<Icon iconName={IconName.Caret} />}
              onPressedChange={setShowOrderbook}
              isPressed={showOrderbook}
            >
              {!showOrderbook && stringGetter({ key: STRING_KEYS.ORDERBOOK })}
            </$OrderbookButton>
            {inputs}
          </$Right>
        </$MobileLayout>
      )}

      <PlaceOrderButtonAndReceipt
        hasValidationErrors={hasInputErrors}
        hasInput={!!amountInput}
        onClearInputs={onClearInputs}
        actionStringKey={inputAlert?.actionStringKey}
        validationErrorString={alertContent}
        summary={summary.summary}
        currentStep={currentStep}
        confirmButtonConfig={{
          stringKey: STRING_KEYS.CLOSE_ORDER,
          buttonTextStringKey: STRING_KEYS.CLOSE_POSITION,
          buttonAction: ButtonAction.Destroy,
        }}
      />
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

const $MobileLayout = styled.div<{ $showOrderbook: boolean }>`
  height: 0;
  // Apply dialog's top/left/right padding to inner scroll areas
  min-height: calc(100% + var(--dialog-content-paddingTop) + var(--dialog-content-paddingBottom));
  margin: calc(-1 * var(--dialog-content-paddingTop)) calc(-1 * var(--dialog-content-paddingLeft))
    calc(-1 * var(--form-rowGap)) calc(-1 * var(--dialog-content-paddingRight));

  display: grid;
  grid-template-columns: ${({ $showOrderbook }) => ($showOrderbook ? '3fr 4fr' : '1fr')};
  ${({ $showOrderbook }) =>
    !$showOrderbook
      ? css`
          padding-left: var(--dialog-content-paddingLeft);
        `
      : ''}
  gap: var(--form-input-gap);
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

const $OrderbookContainer = styled.div`
  display: flex;
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

const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;

const $MidPriceButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;
