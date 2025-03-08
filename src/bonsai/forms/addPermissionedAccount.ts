import { createForm, createVanillaReducer } from '@/bonsai/lib/forms';
import { ErrorType, simpleValidationError, ValidationError } from '@/bonsai/lib/validationErrors';

import { STRING_KEYS } from '@/constants/localization';

import { isValidAddress } from '@/lib/addressUtils';

interface AddPermissionedAccountFormState {
  addressToAdd: string;
  isChecked: boolean;
}

const initialState: AddPermissionedAccountFormState = {
  addressToAdd: '',
  isChecked: false,
};

const reducer = createVanillaReducer({
  initialState,
  actions: {
    setAddressToAdd: (state, addressToAdd: string) => ({ ...state, addressToAdd }),
    setIsChecked: (state, isChecked: boolean) => ({ ...state, isChecked }),
  },
});

type AddPermissionedAccountFormInputData = {
  dydxAddress: string | undefined;
};

type AddPermissionedAccountFormSummary = {};

class AddPermissionedAccountFormValidationErrors {
  addressEmpty(): ValidationError {
    return simpleValidationError({
      code: 'ADDRESS_EMPTY',
      type: ErrorType.error,
      fields: ['addressToAdd'],
      titleKey: STRING_KEYS.ENTER_VALID_ADDRESS,
    });
  }

  addressSameAsSelf(): ValidationError {
    return simpleValidationError({
      code: 'ADDRESS_SAME_AS_SELF',
      type: ErrorType.error,
      fields: ['addressToAdd'],
      titleKey: STRING_KEYS.ENTER_VALID_ADDRESS,
      textKey: STRING_KEYS.TRANSFER_TO_YOURSELF,
    });
  }

  invalidAddress(): ValidationError {
    return simpleValidationError({
      code: 'INVALID_ADDRESS',
      type: ErrorType.error,
      fields: ['addressToAdd'],
      titleKey: STRING_KEYS.ENTER_VALID_ADDRESS,
      textKey: STRING_KEYS.TRANSFER_INVALID_DYDX_ADDRESS,
    });
  }
}

const errors = new AddPermissionedAccountFormValidationErrors();

const getErrors = (
  state: AddPermissionedAccountFormState,
  inputData: AddPermissionedAccountFormInputData,
  _summary: AddPermissionedAccountFormSummary
) => {
  const validationErrors: ValidationError[] = [];

  if (state.isChecked) {
    if (state.addressToAdd.trim() === '') {
      validationErrors.push(errors.addressEmpty());
    }

    if (state.addressToAdd === inputData.dydxAddress) {
      validationErrors.push(errors.addressSameAsSelf());
    }

    if (
      !isValidAddress({
        address: state.addressToAdd,
        network: 'cosmos',
        prefix: 'dydx',
      })
    ) {
      validationErrors.push(errors.invalidAddress());
    }
  }

  return validationErrors;
};

const calculateSummary = (
  state: AddPermissionedAccountFormState,
  inputData: AddPermissionedAccountFormInputData
) => {
  return {
    addressToAdd: state.addressToAdd,
    isChecked: state.isChecked,
    dydxAddress: inputData.dydxAddress,
  };
};

export const AddPermissionedAccountFormFns = createForm({
  reducer,
  calculateSummary,
  getErrors,
});
