import { useCallback, useEffect, useState } from 'react';

import { SelectedGasDenom } from '@dydxprotocol/v4-client-js';
import { shallowEqual, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

import { AlertMessage } from './AlertMessage';
import { Button } from './Button';
import { DetailsItem } from './Details';
import { Icon, IconName } from './Icon';
import { WithDetailsReceipt } from './WithDetailsReceipt';
import { WithTooltip } from './WithTooltip';

export type ButtonError = {
  key: string;
  type: AlertType.Warning | AlertType.Error;
  message: string;
  slotButton?: React.ReactNode;
};

type FormProps = { isForm: true; onClick?: undefined };
type DialogProps = { isForm: false; onClick: () => void };

type ElementProps = {
  detailItems: DetailsItem[];
  error?: ButtonError;
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
  error,
  buttonText,
  gasFee,
  gasDenom,
  isLoading,
  isForm,
  onClick,
  className,
}: ElementProps & StyleProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  //   const { usdcBalance, nativeTokenBalance } = useAccountBalance();
  const usdcBalance = 0;
  const nativeTokenBalance = 0;
  const { usdcLabel, chainTokenLabel } = useTokenConfigs();
  const [errorToDisplay, setErrorToDisplay] = useState(error);

  const depositFunds = useCallback(
    () => dispatch(forceOpenDialog({ type: DialogTypes.Deposit })),
    [dispatch]
  );

  useEffect(() => {
    const balance = gasDenom === SelectedGasDenom.NATIVE ? nativeTokenBalance : usdcBalance;
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
  ]);

  return (
    <>
      {errorToDisplay && (
        <AlertMessage type={errorToDisplay.type}> {errorToDisplay.message} </AlertMessage>
      )}
      <$WithDetailsReceipt detailItems={detailItems} className={className}>
        <WithTooltip tooltipString={errorToDisplay ? errorToDisplay.message : undefined}>
          {!canAccountTrade ? (
            <OnboardingTriggerButton />
          ) : (
            errorToDisplay?.slotButton ?? (
              <$Button
                action={ButtonAction.Primary}
                type={isForm ? ButtonType.Submit : ButtonType.Button}
                onClick={onClick}
                slotLeft={errorToDisplay ? <$WarningIcon iconName={IconName.Warning} /> : undefined}
                state={{
                  isLoading,
                  isDisabled: errorToDisplay !== undefined || gasFee === undefined,
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

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
  width: 100%;
`;

const $Button = styled(Button)`
  width: 100%;
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;
