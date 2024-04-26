import { useDispatch, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent, css } from 'styled-components';

import type { TradeInputSummary } from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useApiState, useStringGetter, useTokenConfigs } from '@/hooks';
import { ConnectionErrorType } from '@/hooks/useApiState';
import { useComplianceState } from '@/hooks/useComplianceState';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountId } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';
import { getCurrentInput } from '@/state/inputsSelectors';

type ConfirmButtonConfig = {
  stringKey: string;
  buttonTextStringKey: string;
  buttonAction: ButtonAction;
};

type ElementProps = {
  isLoading: boolean;
  actionStringKey?: string;
  summary?: TradeInputSummary;
  hasValidationErrors?: boolean;
  validationErrorString?: string;
  currentStep?: MobilePlaceOrderSteps;
  showDeposit?: boolean;
  confirmButtonConfig: ConfirmButtonConfig;
};

export const PlaceOrderButtonAndReceipt = ({
  isLoading,
  actionStringKey,
  summary,
  hasValidationErrors,
  validationErrorString,
  currentStep,
  showDeposit,
  confirmButtonConfig,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { chainTokenLabel } = useTokenConfigs();
  const { connectionError } = useApiState();
  const { complianceState } = useComplianceState();

  const canAccountTrade = useSelector(calculateCanAccountTrade);
  const subaccountNumber = useSelector(getSubaccountId);
  const currentInput = useSelector(getCurrentInput);

  const hasMissingData = subaccountNumber === undefined;

  const tradingUnavailable =
    complianceState === ComplianceStates.READ_ONLY ||
    connectionError === ConnectionErrorType.CHAIN_DISRUPTION;

  const shouldEnableTrade =
    canAccountTrade &&
    !hasMissingData &&
    !hasValidationErrors &&
    currentInput !== 'transfer' &&
    !tradingUnavailable;

  const { fee, price: expectedPrice, total, reward } = summary || {};

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
    {
      key: 'total',
      label: stringGetter({ key: STRING_KEYS.TOTAL }),
      value: <Output type={OutputType.Fiat} value={total} showSign={ShowSign.None} useGrouping />,
    },
  ];

  const buttonStatesPerStep = {
    [MobilePlaceOrderSteps.EditOrder]: {
      buttonTextStringKey: shouldEnableTrade
        ? STRING_KEYS.PREVIEW_ORDER
        : actionStringKey
        ? actionStringKey
        : STRING_KEYS.UNAVAILABLE,
      buttonAction: ButtonAction.Primary,
      buttonState: { isDisabled: !shouldEnableTrade, isLoading: hasMissingData },
    },

    [MobilePlaceOrderSteps.PreviewOrder]: {
      buttonTextStringKey: STRING_KEYS.CONFIRM_ORDER,
      buttonAction: confirmButtonConfig.buttonAction,
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
        isDisabled: !shouldEnableTrade || isLoading,
        isLoading: isLoading || hasMissingData,
      };

  const depositButton = (
    <Button
      action={ButtonAction.Primary}
      onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
    >
      {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
    </Button>
  );

  const submitButton = (
    <Styled.Button
      state={buttonState}
      type={ButtonType.Submit}
      action={buttonAction}
      slotLeft={
        hasValidationErrors ? <Styled.WarningIcon iconName={IconName.Warning} /> : undefined
      }
    >
      {stringGetter({
        key: buttonTextStringKey,
        params: {
          ORDER: stringGetter({
            key: confirmButtonConfig.stringKey,
          }),
        },
      })}
    </Styled.Button>
  );

  return (
    <WithDetailsReceipt detailItems={items}>
      {!canAccountTrade ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : showDeposit && complianceState === ComplianceStates.FULL_ACCESS ? (
        depositButton
      ) : (
        <WithTooltip tooltipString={hasValidationErrors ? validationErrorString : undefined}>
          {submitButton}
        </WithTooltip>
      )}
    </WithDetailsReceipt>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Button = styled(Button)`
  width: 100%;
`;

Styled.WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;
