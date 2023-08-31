import { useState, type FormEvent, useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { CLIENT_NETWORK_CONFIGS } from '@/constants/networks';
import { useAccounts, useStringGetter, useSubaccount } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';

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
              CLIENT_NETWORK_CONFIGS[selectedNetwork].ethereumChainId === 'dydxprotocol-testnet'
                ? 1000
                : 100,
          },
        })}
      </p>
      <Styled.SubmitButton
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
        state={{ isLoading }}
      >
        {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
      </Styled.SubmitButton>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${layoutMixins.column}
  gap: 1rem;
`;

Styled.SubmitButton = styled(Button)`
  ${layoutMixins.stickyFooter}
`;
