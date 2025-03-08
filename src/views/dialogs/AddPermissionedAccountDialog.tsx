import { useEffect, useState } from 'react';

import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import tw from 'twin.macro';

import { AlertType } from '@/constants/alerts';
import { ButtonAction } from '@/constants/buttons';
import { AcknowledgeTermsDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Dialog } from '@/components/Dialog';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';

import { isValidAddress } from '@/lib/addressUtils';

export const AddPermissionedAccountDialog = ({
  setIsOpen,
}: DialogProps<AcknowledgeTermsDialogProps>) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const [addressToAdd, setAddressToAdd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addAuthorizedAccount } = useSubaccount();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const isAddressValid = isValidAddress({
    address: addressToAdd,
    network: 'cosmos',
    prefix: 'dydx',
  });

  const isSameAddress = addressToAdd === dydxAddress;

  useEffect(() => {
    if (isChecked) {
      if (addressToAdd.trim() !== '' && !isAddressValid) {
        setErrorMessage(stringGetter({ key: STRING_KEYS.INVALID_ADDRESS_BODY }));
      } else if (isSameAddress) {
        setErrorMessage('You cannot add your own address to the permissioned list');
      }
    } else {
      setErrorMessage(null);
    }
  }, [addressToAdd, isAddressValid, stringGetter, isChecked, isSameAddress]);

  useEffect(() => {
    setIsChecked(false);
  }, [addressToAdd]);

  const onClose = () => {
    setIsOpen(false);
    // track(
    //   AnalyticsEvents.OnboardingAcknowledgeTermsButtonClick({
    //     agreed: false,
    //   })
    // );
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      await addAuthorizedAccount(addressToAdd);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled =
    !isChecked ||
    addressToAdd.trim() === '' ||
    !isAddressValid ||
    isSameAddress ||
    errorMessage != null;

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Edit Permissioned Account">
      <div tw="flexColumn gap-1">
        <FormInput
          id="authorize-address"
          label={stringGetter({ key: STRING_KEYS.ADDRESS })}
          type={InputType.Text}
          value={addressToAdd}
          onInput={(e: SyntheticInputEvent) => setAddressToAdd(e.target.value)}
        />

        <Checkbox
          id="authorize-address"
          label="I authorize this account to trade on my behalf"
          checked={isChecked}
          onCheckedChange={setIsChecked}
        />

        {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}

        <$Footer>
          <$Button onClick={onClose} action={ButtonAction.Base}>
            {stringGetter({ key: STRING_KEYS.CLOSE })}
          </$Button>
          <$Button
            state={{ isLoading, isDisabled }}
            onClick={onSubmit}
            action={ButtonAction.Primary}
          >
            Authorize
          </$Button>
        </$Footer>
      </div>
    </Dialog>
  );
};

const $Footer = styled.div`
  ${formMixins.footer};
  ${layoutMixins.row}

  gap: 1rem;
`;

const $Button = tw(Button)`grow`;
