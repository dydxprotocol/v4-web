import { useState, type FormEvent, useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { useAccounts, useStringGetter, useSubaccount } from '@/hooks';
import { formMixins } from '@/styles/formMixins';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';
import { Button } from '@/components/Button';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';

import { log } from '@/lib/telemetry';

type DepositFormProps = {
  onDeposit?: () => void;
  onError?: (_: Error) => void;
};

export const TestnetDepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();
  const { dydxAddress, getSubaccounts } = useAccounts();
  const { requestFaucetFunds } = useSubaccount();
  const subAccount = useSelector(getSubaccount, shallowEqual);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);

  const [isLoading, setIsLoading] = useState(false);

  // call getSubaccounts once the subaccount detected via ws from abacus
  useEffect(() => {
    if (dydxAddress && isLoading && subAccount) {
      setIsLoading(false);
      getSubaccounts({ dydxAddress });
    }
  }, [subAccount]);

  return (
    <Styled.Form
      onSubmit={async (e: FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        try {
          await requestFaucetFunds();
          onDeposit?.();

          // do not stop loading if the subaccount is not yet created.
          // subaccount should only not existing during onboarding on first deposit.
          if (subAccount) {
            setIsLoading(false);
          }
        } catch (error) {
          log('TestnetDepositForm/requestFaucetFunds', error);
          onError?.(error);
          setIsLoading(false);
        }
      }}
    >
      <p>
        {stringGetter({
          key: STRING_KEYS.CREDITED_WITH,
          params: {
            AMOUNT_USD:
              ENVIRONMENT_CONFIG_MAP[selectedNetwork].ethereumChainId === 'dydxprotocol-testnet'
                ? 1000
                : 100,
          },
        })}
      </p>
      <Styled.Footer>
        {!canAccountTrade ? (
          <OnboardingTriggerButton size={ButtonSize.Base} />
        ) : (
          <Button action={ButtonAction.Primary} type={ButtonType.Submit} state={{ isLoading }}>
            {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
          </Button>
        )}
      </Styled.Footer>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
`;

Styled.Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);

  button {
    --button-width: 100%;
  }
`;
