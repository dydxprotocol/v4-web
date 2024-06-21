import { useCallback, useEffect, useState } from 'react';

import { SelectedGasDenom } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

import { AlertMessage } from '../components/AlertMessage';
import { Button } from '../components/Button';
import { DetailsItem } from '../components/Details';
import { Icon, IconName } from '../components/Icon';
import { WithDetailsReceipt } from '../components/WithDetailsReceipt';
import { WithTooltip } from '../components/WithTooltip';

type StakeButtonWarning = {
  type: AlertType.Warning | AlertType.Info;
  slotButton?: React.ReactNode;
};

type StakeButtonError = {
  type: AlertType.Error;
  slotButton?: undefined;
};

export type StakeButtonAlert = {
  key: string;
  message: string;
} & (StakeButtonWarning | StakeButtonError);

type FormProps = { isForm: true; onClick?: undefined };
type DialogProps = { isForm: false; onClick: () => void };

type ElementProps = {
  detailItems: DetailsItem[];
  alert?: StakeButtonAlert;
  buttonText: React.ReactNode;
  gasFee?: BigNumberish;
  gasDenom: SelectedGasDenom;
  isLoading: boolean;
} & (FormProps | DialogProps);

type StyleProps = {
  className?: string;
};

export const StakeRewardButtonAndReceipt = ({
  detailItems,
  alert,
  buttonText,
  gasFee,
  gasDenom,
  isLoading,
  isForm,
  onClick,
  className,
}: ElementProps & StyleProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const { usdcBalance, nativeTokenBalance } = useAccountBalance();
  const { usdcLabel, chainTokenLabel } = useTokenConfigs();
  const [errorToDisplay, setErrorToDisplay] = useState(alert);

  const depositFunds = useCallback(
    () => dispatch(forceOpenDialog(DialogTypes.Deposit())),
    [dispatch]
  );

  useEffect(() => {
    const balance =
      gasDenom === SelectedGasDenom.NATIVE ? nativeTokenBalance.toNumber() : usdcBalance;
    const token = gasDenom === SelectedGasDenom.NATIVE ? chainTokenLabel : usdcLabel;

    if (MustBigNumber(balance).lt(gasFee ?? 0)) {
      setErrorToDisplay({
        key: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS,
        type: AlertType.Warning,
        message: stringGetter({
          key: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS,
          params: { TOKEN: token, BALANCE: balance },
        }),
        slotButton: (
          <$Button action={ButtonAction.Primary} onClick={depositFunds}>
            {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
          </$Button>
        ),
      });
    } else {
      setErrorToDisplay(alert);
    }
  }, [
    stringGetter,
    depositFunds,
    gasDenom,
    gasFee,
    chainTokenLabel,
    nativeTokenBalance,
    usdcLabel,
    usdcBalance,
    alert,
  ]);

  const shouldDisplayErrorAsWarning = useCallback(
    () =>
      errorToDisplay &&
      (errorToDisplay.type === AlertType.Error || errorToDisplay.type === AlertType.Warning),
    [errorToDisplay]
  );

  const buttonSize = ButtonSize.Base;

  return (
    <>
      {errorToDisplay && (
        <$AlertMessage type={errorToDisplay.type}> {errorToDisplay.message} </$AlertMessage>
      )}
      <$WithDetailsReceipt detailItems={detailItems} isForm={isForm} className={className}>
        <WithTooltip
          tooltipString={shouldDisplayErrorAsWarning() ? errorToDisplay?.message : undefined}
        >
          {!canAccountTrade ? (
            <$OnboardingTriggerButton size={buttonSize} />
          ) : (
            errorToDisplay?.slotButton ?? (
              <$Button
                action={ButtonAction.Primary}
                type={isForm ? ButtonType.Submit : ButtonType.Button}
                size={buttonSize}
                onClick={onClick}
                slotLeft={
                  shouldDisplayErrorAsWarning() ? (
                    <$WarningIcon iconName={IconName.Warning} />
                  ) : undefined
                }
                state={{
                  isLoading,
                  isDisabled: errorToDisplay?.type === AlertType.Error || gasFee === undefined,
                }}
              >
                {buttonText}
              </$Button>
            )
          )}
        </WithTooltip>
      </$WithDetailsReceipt>
    </>
  );
};

const $AlertMessage = styled(AlertMessage)`
  width: 100%;
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)<{ isForm: boolean }>`
  --withReceipt-backgroundColor: var(--color-layer-2);

  color: var(--color-text-form);
  width: 100%;

  ${({ isForm }) =>
    isForm &&
    css`
      dl {
        padding: var(--form-input-paddingY) var(--form-input-paddingX);
      }
    `}
`;

const $OnboardingTriggerButton = styled(OnboardingTriggerButton)`
  width: 100%;
`;

const $Button = styled(Button)`
  width: 100%;
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;
