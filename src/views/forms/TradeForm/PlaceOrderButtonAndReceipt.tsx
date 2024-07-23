import { shallowEqual } from 'react-redux';

import { AbacusInputTypes, AbacusMarginMode, type TradeInputSummary } from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps, TradeTypes } from '@/constants/trade';

import { ConnectionErrorType, useApiState } from '@/hooks/useApiState';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getCurrentMarketPositionData, getSubaccountId } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getCurrentInput, getInputTradeMarginMode } from '@/state/inputsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { nullIfZero } from '@/lib/numbers';
import {
  calculateCrossPositionMargin,
  getTradeStateWithDoubleValuesHasDiff,
} from '@/lib/tradeData';
import { orEmptyObj } from '@/lib/typeUtils';

import { useTradeTypeOptions } from './useTradeTypeOptions';

type ConfirmButtonConfig = {
  stringKey: string;
  buttonTextStringKey: string;
  buttonAction: ButtonAction;
};

type ElementProps = {
  actionStringKey?: string;
  summary?: TradeInputSummary;
  hasValidationErrors?: boolean;
  validationErrorString?: string;
  currentStep?: MobilePlaceOrderSteps;
  showDeposit?: boolean;
  confirmButtonConfig: ConfirmButtonConfig;
};

export const PlaceOrderButtonAndReceipt = ({
  actionStringKey,
  summary,
  hasValidationErrors,
  validationErrorString,
  currentStep,
  showDeposit,
  confirmButtonConfig,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { chainTokenLabel } = useTokenConfigs();
  const { connectionError } = useApiState();
  const { complianceState } = useComplianceState();
  const { selectedTradeType } = useTradeTypeOptions();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const subaccountNumber = useAppSelector(getSubaccountId);
  const currentInput = useAppSelector(getCurrentInput);
  const { tickSizeDecimals } = orEmptyObj(useAppSelector(getCurrentMarketConfig, shallowEqual));
  const { liquidationPrice, equity, leverage, notionalTotal, adjustedMmf } = orEmptyObj(
    useAppSelector(getCurrentMarketPositionData, shallowEqual)
  );

  const marginMode = useAppSelector(getInputTradeMarginMode, shallowEqual);

  const hasMissingData = subaccountNumber === undefined;

  const closeOnlyTradingUnavailable =
    complianceState === ComplianceStates.CLOSE_ONLY &&
    selectedTradeType !== TradeTypes.MARKET &&
    currentInput !== AbacusInputTypes.ClosePosition;

  const tradingUnavailable =
    closeOnlyTradingUnavailable ||
    complianceState === ComplianceStates.READ_ONLY ||
    connectionError === ConnectionErrorType.CHAIN_DISRUPTION;

  const shouldEnableTrade =
    canAccountTrade &&
    !hasMissingData &&
    !hasValidationErrors &&
    currentInput !== AbacusInputTypes.Transfer &&
    !tradingUnavailable;

  const { fee, price: expectedPrice, reward } = summary ?? {};

  // check if required fields are filled and summary has been calculated
  const areInputsFilled = fee != null || reward != null;

  const renderMarginValue = () => {
    if (marginMode === AbacusMarginMode.Cross) {
      const currentCrossMargin = nullIfZero(
        calculateCrossPositionMargin({
          notionalTotal: notionalTotal?.current,
          adjustedMmf: adjustedMmf?.current,
        })
      );

      const postOrderCrossMargin = nullIfZero(
        calculateCrossPositionMargin({
          notionalTotal: notionalTotal?.postOrder,
          adjustedMmf: adjustedMmf?.postOrder,
        })
      );

      return (
        <DiffOutput
          useGrouping
          type={OutputType.Fiat}
          value={currentCrossMargin}
          newValue={postOrderCrossMargin}
          withDiff={areInputsFilled && currentCrossMargin !== postOrderCrossMargin}
        />
      );
    }

    return (
      <DiffOutput
        useGrouping
        type={OutputType.Fiat}
        value={equity?.current}
        newValue={equity?.postOrder}
        withDiff={areInputsFilled && getTradeStateWithDoubleValuesHasDiff(equity)}
      />
    );
  };

  const items = [
    {
      key: 'expected-price',
      label: (
        <WithTooltip tooltip="expected-price" side="right">
          {stringGetter({ key: STRING_KEYS.EXPECTED_PRICE })}
        </WithTooltip>
      ),
      value: (
        <Output
          useGrouping
          fractionDigits={tickSizeDecimals}
          type={OutputType.Fiat}
          value={expectedPrice}
        />
      ),
    },
    {
      key: 'liquidation-price',
      label: stringGetter({ key: STRING_KEYS.LIQUIDATION_PRICE }),
      value: (
        <DiffOutput
          useGrouping
          type={OutputType.Fiat}
          fractionDigits={tickSizeDecimals}
          value={liquidationPrice?.current}
          newValue={liquidationPrice?.postOrder}
          withDiff={areInputsFilled && getTradeStateWithDoubleValuesHasDiff(liquidationPrice)}
        />
      ),
    },
    {
      key: 'position-margin',
      label: stringGetter({ key: STRING_KEYS.POSITION_MARGIN }),
      value: renderMarginValue(),
    },
    {
      key: 'position-leverage',
      label: stringGetter({ key: STRING_KEYS.POSITION_LEVERAGE }),
      value: (
        <DiffOutput
          useGrouping
          type={OutputType.Multiple}
          value={nullIfZero(leverage?.current)}
          newValue={leverage?.postOrder}
          withDiff={areInputsFilled && getTradeStateWithDoubleValuesHasDiff(leverage)}
          showSign={ShowSign.None}
        />
      ),
    },
    {
      key: 'fee',
      label: (
        <WithTooltip tooltip="fee" side="right">
          {stringGetter({ key: STRING_KEYS.FEE })}
        </WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={fee} useGrouping />,
    },
    {
      key: 'max-reward',
      label: (
        <>
          {stringGetter({ key: STRING_KEYS.MAXIMUM_REWARDS })}
          <AssetIcon symbol={chainTokenLabel} />
        </>
      ),
      value: (
        <Output
          type={OutputType.Asset}
          value={reward}
          useGrouping
          tag={reward ? chainTokenLabel : ''}
        />
      ),
      tooltip: 'max-reward',
    },
  ].filter(isTruthy);

  const returnToMarketState = () => ({
    buttonTextStringKey: STRING_KEYS.RETURN_TO_MARKET,
    buttonAction: ButtonAction.Secondary,
    buttonState: {},
    showValidatorError: false,
  });

  const buttonStatesPerStep = {
    [MobilePlaceOrderSteps.EditOrder]: {
      buttonTextStringKey: shouldEnableTrade
        ? STRING_KEYS.PREVIEW_ORDER
        : actionStringKey ?? STRING_KEYS.UNAVAILABLE,
      buttonAction: ButtonAction.Primary,
      buttonState: { isDisabled: !shouldEnableTrade, isLoading: hasMissingData },
      showValidatorError: true,
    },

    [MobilePlaceOrderSteps.PreviewOrder]: {
      buttonTextStringKey: STRING_KEYS.CONFIRM_ORDER,
      buttonAction: confirmButtonConfig.buttonAction,
      buttonState: {},
      showValidatorError: false,
    },
    [MobilePlaceOrderSteps.PlacingOrder]: returnToMarketState(),
    [MobilePlaceOrderSteps.PlaceOrderFailed]: returnToMarketState(),
    [MobilePlaceOrderSteps.Confirmation]: returnToMarketState(),
  };

  const buttonAction = currentStep
    ? buttonStatesPerStep[currentStep].buttonAction
    : confirmButtonConfig.buttonAction;

  let buttonTextStringKey = STRING_KEYS.UNAVAILABLE;
  if (tradingUnavailable) {
    buttonTextStringKey = STRING_KEYS.UNAVAILABLE;
  } else if (currentStep) {
    buttonTextStringKey = buttonStatesPerStep[currentStep].buttonTextStringKey;
  } else if (shouldEnableTrade) {
    buttonTextStringKey = confirmButtonConfig.buttonTextStringKey;
  } else if (actionStringKey) {
    buttonTextStringKey = actionStringKey;
  }

  const buttonState = currentStep
    ? buttonStatesPerStep[currentStep].buttonState
    : {
        isDisabled: !shouldEnableTrade,
        isLoading: hasMissingData,
      };

  const depositButton = (
    <Button
      action={ButtonAction.Primary}
      onClick={() => dispatch(openDialog(DialogTypes.Deposit()))}
    >
      {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
    </Button>
  );

  const showValidatorErrors =
    hasValidationErrors && (!currentStep || buttonStatesPerStep[currentStep].showValidatorError);

  const submitButton = (
    <Button
      state={buttonState}
      type={ButtonType.Submit}
      action={buttonAction}
      slotLeft={
        showValidatorErrors ? <Icon iconName={IconName.Warning} tw="text-warning" /> : undefined
      }
      tw="w-full"
    >
      {stringGetter({
        key: buttonTextStringKey,
        params: {
          ORDER: stringGetter({
            key: confirmButtonConfig.stringKey,
          }),
        },
      })}
    </Button>
  );

  return (
    <WithDetailsReceipt detailItems={items}>
      {!canAccountTrade ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : showDeposit && complianceState === ComplianceStates.FULL_ACCESS ? (
        depositButton
      ) : (
        <WithTooltip tooltipString={showValidatorErrors ? validationErrorString : undefined}>
          {submitButton}
        </WithTooltip>
      )}
    </WithDetailsReceipt>
  );
};
