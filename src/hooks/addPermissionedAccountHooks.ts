import { useMemo } from 'react';

import { AddPermissionedAccountFormFns } from '@/bonsai/forms/addPermissionedAccount';
import { useFormValues } from '@/bonsai/lib/forms';

import { useAccounts } from './useAccounts';

export const useAddPermissionedAccountForm = () => {
  const { dydxAddress } = useAccounts();

  const inputs = useMemo(
    () => ({
      dydxAddress,
    }),
    [dydxAddress]
  );

  return useFormValues(AddPermissionedAccountFormFns, inputs);
};
