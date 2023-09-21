import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import type { TradeInputSummary } from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TRADE_TYPE_STRINGS, MobilePlaceOrderSteps } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

import { Button } from '@/components/Button';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountId } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';
import { getCurrentInput, getInputTradeData } from '@/state/inputsSelectors';

import { getSelectedOrderSide, getSelectedTradeType } from '@/lib/tradeData';

type ElementProps = {
  isLoading: boolean;
  isClosePosition?: boolean;
  actionStringKey?: string;
  summary?: TradeInputSummary;
  hasValidationErrors?: boolean;
  currentStep?: MobilePlaceOrderSteps;
  showDeposit?: boolean;
  showConnectWallet?: boolean;
};

export const PlaceOrderButtonAndReceipt = ({
  isLoading,
  isClosePosition,
  actionStringKey,
  summary,
  hasValidationErrors,
  currentStep,
  showDeposit,
  showConnectWallet,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();

  const canAccountTrade = useSelector(calculateCanAccountTrade);
  const subaccountNumber = useSelector(getSubaccountId);
  const currentInput = useSelector(getCurrentInput);
  const currentTradeData = useSelector(getInputTradeData, shallowEqual);

  const hasMissingData = subaccountNumber === undefined;

  const shouldEnableTrade =
    canAccountTrade && !hasMissingData && !hasValidationErrors && currentInput !== 'transfer';

  const { side, type } = currentTradeData || {};

  const selectedTradeType = getSelectedTradeType(type);
  const selectedOrderSide = getSelectedOrderSide(side);

  const { fee, price: expectedPrice, total } = summary || {};

  const items = [
    {
      key: 'expected-price',
      label: (
        <WithTooltip tooltip="expected-price" side="right">
          {stringGetter({ key: STRING_KEYS.EXPECTED_PRICE })}
        </WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={expectedPrice} useGrouping />,
    },
    {
      key: 'fee',
      label: stringGetter({ key: STRING_KEYS.FEE }),
      value: <Output type={OutputType.Fiat} value={fee} useGrouping />,
    },
    {
      key: 'total',
      label: stringGetter({ key: STRING_KEYS.TOTAL }),
      value: <Output type={OutputType.Fiat} value={total} showSign={ShowSign.None} useGrouping />,
    },
  ];

  const orderSideAction = {
    [OrderSide.BUY]: ButtonAction.Create,
    [OrderSide.SELL]: ButtonAction.Destroy,
  }[selectedOrderSide];

  const buttonStatesPerStep = {
    [MobilePlaceOrderSteps.EditOrder]: {
      buttonTextStringKey: shouldEnableTrade
        ? STRING_KEYS.PREVIEW_ORDER
        : actionStringKey
        ? actionStringKey
        : STRING_KEYS.UNAVAILABLE,
      buttonAction: ButtonAction.Primary,
      buttonState: { isDisabled: !shouldEnableTrade },
    },

    [MobilePlaceOrderSteps.PreviewOrder]: {
      buttonTextStringKey: STRING_KEYS.CONFIRM_ORDER,
      buttonAction: isClosePosition ? ButtonAction.Destroy : orderSideAction,
      buttonState: { isLoading },
    },
    [MobilePlaceOrderSteps.PlacingOrder]: {
      buttonTextStringKey: STRING_KEYS.RETURN_TO_MARKET,
      buttonAction: ButtonAction.Secondary,
      buttonState: {},
    },
    [MobilePlaceOrderSteps.Confirmation]: {
      buttonTextStringKey: STRING_KEYS.RETURN_TO_MARKET,
      buttonAction: ButtonAction.Secondary,
      buttonState: {},
    },
  };

  const buttonAction = currentStep
    ? buttonStatesPerStep[currentStep].buttonAction
    : isClosePosition
    ? ButtonAction.Destroy
    : orderSideAction;

  let buttonTextStringKey = STRING_KEYS.UNAVAILABLE;
  if (currentStep) {
    buttonTextStringKey = buttonStatesPerStep[currentStep].buttonTextStringKey;
  } else if (shouldEnableTrade) {
    buttonTextStringKey = isClosePosition ? STRING_KEYS.CLOSE_POSITION : STRING_KEYS.PLACE_ORDER;
  } else if (actionStringKey) {
    buttonTextStringKey = actionStringKey;
  }

  const buttonState = currentStep
    ? buttonStatesPerStep[currentStep].buttonState
    : { isDisabled: !shouldEnableTrade || isLoading, isLoading };

  return (
    <WithDetailsReceipt detailItems={items}>
      {!canAccountTrade || showConnectWallet ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : showDeposit ? (
        <Button
          action={ButtonAction.Primary}
          onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
        >
          {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
        </Button>
      ) : (
        <Button state={buttonState} type={ButtonType.Submit} action={buttonAction}>
          {stringGetter({
            key: buttonTextStringKey,
            params: {
              ORDER: stringGetter({
                key: isClosePosition
                  ? STRING_KEYS.CLOSE_ORDER
                  : TRADE_TYPE_STRINGS[selectedTradeType].tradeTypeKey,
              }),
            },
          })}
        </Button>
      )}
    </WithDetailsReceipt>
  );
};
