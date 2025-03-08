import { useMemo, useState } from 'react';

import { ErrorType } from '@/bonsai/lib/validationErrors';
import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import tw from 'twin.macro';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { AcknowledgeTermsDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAddPermissionedAccountForm } from '@/hooks/addPermissionedAccountHooks';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Dialog } from '@/components/Dialog';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { ToggleButton } from '@/components/ToggleButton';
import { ValidationAlertMessage } from '@/components/ValidationAlert';

import { useDisappearingValue } from '@/lib/disappearingValue';

export const AddPermissionedAccountDialog = ({
  setIsOpen,
}: DialogProps<AcknowledgeTermsDialogProps>) => {
  const stringGetter = useStringGetter();
  const { addAuthorizedAccount } = useSubaccount();
  const [errorMessage, setErrorMessage] = useDisappearingValue<string>();

  const form = useAddPermissionedAccountForm();
  const { addressToAdd, isChecked } = form.state;

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const validationErrors = form.errors;

  const isDisabled = !isChecked || validationErrors.length > 0;

  const onClose = () => {
    setIsOpen(false);
  };

  const onChangeAddress = (value: string) => {
    form.actions.setAddressToAdd(value);
  };

  const onChangeChecked = (value: boolean) => {
    form.actions.setIsChecked(value);
  };
  const onSubmit = async () => {
    if (!isChecked) {
      return;
    }

    setErrorMessage(undefined);

    try {
      setIsLoading(true);
      await addAuthorizedAccount(addressToAdd);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasteAddress = async () => {
    try {
      const value = await navigator.clipboard.readText();
      onChangeAddress(value);
    } catch (err) {
      // expected error if user rejects clipboard access
    }
  };

  const onClear = () => {
    onChangeAddress('');
  };

  const firstError = useMemo(
    () => form.errors.find((e) => e.type === ErrorType.error),
    [form.errors]
  );

  const ctaErrorAction = useMemo(() => {
    const key = firstError?.resources.title?.stringKey;
    return key ? stringGetter({ key }) : undefined;
  }, [firstError?.resources.title?.stringKey, stringGetter]);

  const validationAlert = useMemo(() => {
    return firstError?.resources.text?.stringKey != null ? firstError : undefined;
  }, [firstError]);

  const hasErrors = useMemo(() => {
    return firstError != null;
  }, [firstError]);

  const isAddressEmpty = addressToAdd.trim() === '';

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Edit Permissioned Account">
      <div tw="flexColumn gap-1">
        <FormInput
          id="authorize-address"
          label={stringGetter({ key: STRING_KEYS.ADDRESS })}
          type={InputType.Text}
          value={addressToAdd}
          onInput={(e: SyntheticInputEvent) => onChangeAddress(e.target.value)}
          slotRight={
            <$FormInputToggleButton
              size={ButtonSize.XSmall}
              isPressed={!isAddressEmpty}
              onPressedChange={(isPressed: boolean) => (isPressed ? onPasteAddress() : onClear())}
              disabled={isLoading}
              shape={isAddressEmpty ? ButtonShape.Rectangle : ButtonShape.Circle}
            >
              {isAddressEmpty ? (
                stringGetter({ key: STRING_KEYS.PASTE })
              ) : (
                <Icon iconName={IconName.Close} />
              )}
            </$FormInputToggleButton>
          }
        />

        <Checkbox
          id="authorize-address"
          label="I authorize this account to trade on my behalf"
          checked={isChecked}
          onCheckedChange={onChangeChecked}
        />
        {validationAlert && <ValidationAlertMessage error={validationAlert} />}
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
            {hasErrors ? ctaErrorAction : 'Authorize'}
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

const $FormInputToggleButton = styled(ToggleButton)`
  ${formMixins.inputInnerToggleButton}

  --button-padding: 0 0.5rem;
`;
