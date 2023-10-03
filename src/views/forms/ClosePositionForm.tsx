import { type FormEvent, useCallback, useEffect, useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import {
  ClosePositionInputField,
  type HumanReadablePlaceOrderPayload,
  type Nullable,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps } from '@/constants/trade';
import { useBreakpoints, useIsFirstRender, useStringGetter, useSubaccount } from '@/hooks';
import { useOnLastOrderIndexed } from '@/hooks/useOnLastOrderIndexed';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';
import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { PlaceOrderButtonAndReceipt } from './TradeForm/PlaceOrderButtonAndReceipt';

import { Orderbook, orderbookMixins, type OrderbookScrollBehavior } from '@/views/tables/Orderbook';

import { PositionPreview } from '@/views/forms/TradeForm/PositionPreview';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getInputClosePositionData } from '@/state/inputsSelectors';
import { getCurrentMarketConfig, getCurrentMarketId } from '@/state/perpetualsSelectors';
import { closeDialog } from '@/state/dialogs';
import { getCurrentInput } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

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
  const [isClosingPosition, setIsClosingPosition] = useState(false);

  const { closePosition } = useSubaccount();

  const market = useSelector(getCurrentMarketId);
  const { id } = useSelector(getCurrentMarketAssetData, shallowEqual) || {};
  const { stepSizeDecimals } = useSelector(getCurrentMarketConfig, shallowEqual) || {};
  const { size: sizeData, summary } = useSelector(getInputClosePositionData, shallowEqual) || {};
  const { size, percent } = sizeData || {};
  const currentInput = useSelector(getCurrentInput);
  const currentPositionData = useSelector(getCurrentMarketPositionData, shallowEqual);
  const { size: currentPositionSize } = currentPositionData || {};
  const { current: currentSize } = currentPositionSize || {};
  const currentSizeBN = MustBigNumber(currentSize).abs();

  useEffect(() => {
    if (currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder) return;

    if (currentInput !== 'closePosition') {
      abacusStateManager.setClosePositionValue({
        value: market,
        field: ClosePositionInputField.market,
      });

      abacusStateManager.setClosePositionValue({
        value: SIZE_PERCENT_OPTIONS[MAX_KEY],
        field: ClosePositionInputField.percent,
      });
    }
  }, [currentInput, market, currentStep]);

  const onLastOrderIndexed = useCallback(() => {
    if (!isFirstRender) {
      abacusStateManager.clearClosePositionInputValues({ shouldFocusOnTradeInput: true });
      onClosePositionSuccess?.();

      if (currentStep === MobilePlaceOrderSteps.PlacingOrder) {
        setCurrentStep?.(MobilePlaceOrderSteps.Confirmation);
      }

      setIsClosingPosition(false);
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    switch (currentStep) {
      case MobilePlaceOrderSteps.EditOrder: {
        setCurrentStep?.(MobilePlaceOrderSteps.PreviewOrder);
        break;
      }
      case MobilePlaceOrderSteps.PlacingOrder:
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

  const onClosePosition = async () => {
    setClosePositionError(undefined);
    setIsClosingPosition(true);

    await closePosition({
      onError: (errorParams?: { errorStringKey?: Nullable<string> }) => {
        setClosePositionError(
          stringGetter({ key: errorParams?.errorStringKey || STRING_KEYS.SOMETHING_WENT_WRONG })
        );
        setIsClosingPosition(false);
      },
      onSuccess: (placeOrderPayload: Nullable<HumanReadablePlaceOrderPayload>) => {
        setUnIndexedClientId(placeOrderPayload?.clientId);
      },
    });
  };

  const alertMessage = closePositionError && (
    <AlertMessage type={AlertType.Error}>{closePositionError}</AlertMessage>
  );

  const inputs = (
    <Styled.InputsColumn>
      <Styled.FormInput
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

      <Styled.ToggleGroup
        items={Object.entries(SIZE_PERCENT_OPTIONS).map(([key, value]) => ({
          label: key === MAX_KEY ? stringGetter({ key: STRING_KEYS.FULL_CLOSE }) : key,
          value: value.toString(),
        }))}
        value={percent?.toString() ?? ''}
        onValueChange={(value: any) => onSelectPercentage((value || percent?.toString()) ?? '')}
        shape={ButtonShape.Rectangle}
      />

      {alertMessage}
    </Styled.InputsColumn>
  );

  return (
    <Styled.ClosePositionForm onSubmit={onSubmit} className={className}>
      {!isTablet ? (
        inputs
      ) : currentStep && currentStep !== MobilePlaceOrderSteps.EditOrder ? (
        <Styled.PreviewAndConfirmContent>
          <PositionPreview />
          {alertMessage}
        </Styled.PreviewAndConfirmContent>
      ) : (
        <Styled.MobileLayout>
          <Styled.OrderbookScrollArea scrollBehavior="snapToCenterUnlessHovered">
            <Styled.Orderbook hideHeader />
          </Styled.OrderbookScrollArea>

          <Styled.Right>
            <PositionPreview showNarrowVariation />
            {inputs}
          </Styled.Right>
        </Styled.MobileLayout>
      )}

      <Styled.Footer>
        {size != null && (
          <Styled.ButtonRow>
            <Button
              type={ButtonType.Reset}
              action={ButtonAction.Reset}
              shape={ButtonShape.Pill}
              size={ButtonSize.XSmall}
              onClick={() => {
                abacusStateManager.setClosePositionValue({
                  value: null,
                  field: ClosePositionInputField.percent,
                });
                abacusStateManager.setClosePositionValue({
                  value: null,
                  field: ClosePositionInputField.size,
                });
              }}
            >
              {stringGetter({ key: STRING_KEYS.CLEAR })}
            </Button>
          </Styled.ButtonRow>
        )}

        <PlaceOrderButtonAndReceipt
          isLoading={isClosingPosition}
          hasValidationErrors={!size}
          actionStringKey={!size ? STRING_KEYS.ENTER_AMOUNT : undefined}
          summary={summary ?? undefined}
          currentStep={currentStep}
          isClosePosition
        />
      </Styled.Footer>
    </Styled.ClosePositionForm>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ClosePositionForm = styled.form`
  --form-rowGap: 1.25rem;

  ${layoutMixins.expandingColumnWithFooter}
  gap: var(--form-rowGap);
  align-items: start;

  ${layoutMixins.stickyArea1}
  --stickyArea1-background: var(--color-layer-2);
  --stickyArea1-paddingBottom: var(--dialog-content-paddingBottom);

  @media ${breakpoints.tablet} {
    ${layoutMixins.expandingColumnWithFooter}

    --orderbox-column-width: 140px;
    --orderbook-width: calc(var(--orderbox-column-width) + var(--dialog-content-paddingLeft));

    && * {
      outline: none !important;
    }
  }
`;

Styled.PreviewAndConfirmContent = styled.div`
  ${layoutMixins.flexColumn}
  gap: var(--form-input-gap);
`;

Styled.MobileLayout = styled.div`
  height: 0;
  // Apply dialog's top/left/right padding to inner scroll areas
  min-height: calc(100% + var(--dialog-content-paddingTop) + var(--dialog-content-paddingBottom));
  margin: calc(-1 * var(--dialog-content-paddingTop)) calc(-1 * var(--dialog-content-paddingLeft))
    calc(-1 * var(--form-rowGap)) calc(-1 * var(--dialog-content-paddingRight));

  display: grid;
  grid-template-columns: 3fr 4fr;
  gap: var(--form-input-gap);
`;

Styled.OrderbookScrollArea = styled.div<{
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

Styled.Orderbook = styled(Orderbook)`
  min-height: 100%;
  --tableCell-padding: 0.5em 1em;
`;

Styled.Right = styled.div`
  height: 0;
  min-height: 100%;
  ${layoutMixins.scrollArea}

  ${layoutMixins.flexColumn}
  padding-right: var(--dialog-content-paddingRight);

  padding-top: var(--dialog-content-paddingTop);
  padding-bottom: var(--form-rowGap);
  gap: 1rem;
`;

Styled.FormInput = styled(FormInput)`
  width: 100%;
`;

Styled.ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}

  @media ${breakpoints.mobile} {
    > :last-child {
      flex-basis: 100%;
    }
  }
`;

Styled.Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  backdrop-filter: none;

  ${layoutMixins.column}
  ${layoutMixins.noPointerEvents}
  margin-top: auto;
`;

Styled.ButtonRow = styled.div`
  ${layoutMixins.row}
  justify-self: end;
  padding: 0.5rem 0 0.5rem 0;
`;

Styled.InputsColumn = styled.div`
  ${formMixins.inputsColumn}
`;
