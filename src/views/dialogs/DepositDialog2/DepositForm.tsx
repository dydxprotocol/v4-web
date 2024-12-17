import { useState } from 'react';

import { mainnet } from 'viem/chains';

import { ButtonAction, ButtonState, ButtonType } from '@/constants/buttons';
import { USDC_ADDRESSES } from '@/constants/tokens';

import { Button } from '@/components/Button';

import { AmountInput } from './AmountInput';

export const DepositForm = ({ onTokenSelect }: { onTokenSelect: () => void }) => {
  const [amount, setAmount] = useState('');
  const [token] = useState({
    chain: mainnet.id.toString(),
    address: USDC_ADDRESSES[mainnet.id],
    symbol: 'USDC',
  });

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
        Deposit
      </Button>
    </div>
  );
};
