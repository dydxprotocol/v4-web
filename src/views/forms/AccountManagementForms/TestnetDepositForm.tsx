import { useEffect, useState, type FormEvent } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';

import abacusStateManager from '@/lib/abacus';
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
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);
  const ethereumChainId = useEnvConfig('ethereumChainId');

  const [isLoading, setIsLoading] = useState(false);

  // call getSubaccounts once the subaccount detected via ws from abacus
  useEffect(() => {
    if (dydxAddress && isLoading && subAccount) {
      setIsLoading(false);
      getSubaccounts({ dydxAddress });
    }
  }, [subAccount]);

  useEffect(() => {
    return () => {
      abacusStateManager.resetInputState();
    };
  }, []);

  return (
    <$Form
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
            AMOUNT_USD: ethereumChainId === 'dydxprotocol-testnet' ? 1000 : 100,
          },
        })}
      </p>
      <$Footer>
        {!canAccountTrade ? (
          <OnboardingTriggerButton size={ButtonSize.Base} />
        ) : (
          <Button action={ButtonAction.Primary} type={ButtonType.Submit} state={{ isLoading }}>
            {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
          </Button>
        )}
      </$Footer>
    </$Form>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);

  button {
    --button-width: 100%;
  }
`;
