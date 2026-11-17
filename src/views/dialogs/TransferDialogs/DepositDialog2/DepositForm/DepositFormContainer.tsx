import { Dispatch, RefObject, SetStateAction, useState } from 'react';

import { TokenForTransfer } from '@/constants/tokens';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';

import { useAppDispatch } from '@/state/appTypes';
import { addDeposit, Deposit } from '@/state/transfers';

import { DepositForm } from './DepositForm';
import { TokenSelect } from './TokenSelect';

export type DepositFormState = 'form' | 'token-select';

export const DepositFormContent = ({
  defaultToken,
  formState,
  onShowForm,
  setFormState,
  tokenSelectRef,
  onDeposit,
}: {
  defaultToken: TokenForTransfer;
  formState: 'form' | 'token-select';
  onShowForm: () => void;
  setFormState: Dispatch<SetStateAction<DepositFormState>>;
  tokenSelectRef: RefObject<HTMLDivElement>;
  onDeposit: (args: { txHash: string; chainId: string }) => void;
}) => {
  const dispatch = useAppDispatch();
  const { dydxAddress } = useAccounts();
  const { isMobile } = useBreakpoints();

  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenForTransfer>(defaultToken);

  const handleDeposit = (deposit: Deposit) => {
    if (!dydxAddress) return;

    onDeposit({ txHash: deposit.txHash, chainId: deposit.chainId });
    dispatch(addDeposit({ deposit, dydxAddress }));
  };

  return (
    <div tw="h-full w-full overflow-hidden">
      <div tw="flex h-full w-[200%]">
        <div
          tw="w-[50%]"
          css={{
            marginLeft: formState === 'form' ? 0 : '-50%',
            transition: 'margin 500ms',
          }}
        >
          <DepositForm
            onDeposit={handleDeposit}
            amount={amount}
            setAmount={setAmount}
            token={token}
            onTokenSelect={() => setFormState('token-select')}
          />
        </div>

        <div
          ref={tokenSelectRef}
          tw="w-[50%] overflow-scroll"
          css={{
            pointerEvents: formState !== 'token-select' ? 'none' : undefined,
            height: formState !== 'token-select' ? 0 : '100%',
            maxHeight: isMobile ? undefined : '30rem',
          }}
        >
          <TokenSelect
            disabled={formState !== 'token-select'}
            token={token}
            setToken={setToken}
            onBack={onShowForm}
          />
        </div>
      </div>
    </div>
  );
};
