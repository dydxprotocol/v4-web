import { Dispatch, SetStateAction } from 'react';

import { ButtonAction, ButtonState, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { AddressInput } from './AddressInput';
import { AmountInput } from './AmountInput';

export const WithdrawForm = ({
  amount,
  setAmount,
  destinationAddress,
  setDestinationAddress,
  destinationChain,
  onChainSelect,
}: {
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  destinationAddress: string;
  setDestinationAddress: Dispatch<SetStateAction<string>>;
  destinationChain: string;
  onChainSelect: () => void;
}) => {
  const stringGetter = useStringGetter();

  return (
    <div tw="flex min-h-10 flex-col gap-1 p-1.25">
      <AddressInput
        value={destinationAddress}
        onChange={setDestinationAddress}
        _destinationChain={destinationChain}
        onDestinationClicked={onChainSelect}
      />
      <AmountInput value={amount} onChange={setAmount} />
      <Button
        tw="w-full"
        state={ButtonState.Disabled}
        disabled
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
      >
        {stringGetter({ key: STRING_KEYS.WITHDRAW })}
      </Button>
    </div>
  );
};
