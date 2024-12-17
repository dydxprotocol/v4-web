import { Dispatch, SetStateAction } from 'react';

import { ButtonAction, ButtonState, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { AmountInput } from './AmountInput';
import { DepositToken } from './types';

export const DepositForm = ({
  onTokenSelect,
  amount,
  setAmount,
  token,
}: {
  onTokenSelect: () => void;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  token: DepositToken;
}) => {
  const stringGetter = useStringGetter();

  return (
    <div tw="flex min-h-10 flex-col gap-1 p-1">
      <AmountInput value={amount} onChange={setAmount} token={token} onTokenClick={onTokenSelect} />
      <Button
        tw="w-full"
        state={ButtonState.Disabled}
        disabled
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
      >
        {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
      </Button>
    </div>
  );
};
