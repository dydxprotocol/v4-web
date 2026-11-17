import { Dispatch, RefObject, SetStateAction, useEffect, useRef, useState } from 'react';

import { timeUnits } from '@/constants/time';
import { TokenForTransfer } from '@/constants/tokens';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';

import { useAppDispatch } from '@/state/appTypes';
import { addDeposit, Deposit } from '@/state/transfers';

import { useDepositTokenBalances } from '../queries';
import { DepositForm } from './DepositForm';
import { TokenSelect } from './TokenSelect';
import { WalletAddressDeposit } from './WalletAddressDeposit';

export type DepositFormState = 'form' | 'token-select' | 'wallet-address';

const WALLET_ADDRESS_BALANCE_REFETCH_INTERVAL = 10 * timeUnits.second;

export const DepositFormContent = ({
  defaultToken,
  formState,
  onShowForm,
  setFormState,
  tokenSelectRef,
  onDeposit,
  canDepositToWalletAddress,
}: {
  defaultToken: TokenForTransfer;
  formState: DepositFormState;
  onShowForm: () => void;
  setFormState: Dispatch<SetStateAction<DepositFormState>>;
  tokenSelectRef: RefObject<HTMLDivElement>;
  onDeposit: (args: { txHash: string; chainId: string }) => void;
  canDepositToWalletAddress?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const { dydxAddress } = useAccounts();
  const { isMobile } = useBreakpoints();

  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenForTransfer>(defaultToken);

  const { withBalances } = useDepositTokenBalances({
    refetchInterval:
      formState === 'wallet-address' ? WALLET_ADDRESS_BALANCE_REFETCH_INTERVAL : undefined,
  });

  const highestBalance = withBalances.at(0);
  const hadBalancesRef = useRef(withBalances.length > 0);

  useEffect(() => {
    const hasBalances = highestBalance != null;
    if (
      !hadBalancesRef.current &&
      hasBalances &&
      formState === 'wallet-address' &&
      highestBalance.decimals != null
    ) {
      setToken({
        chainId: highestBalance.chainId,
        denom: highestBalance.denom,
        decimals: highestBalance.decimals,
      });
      onShowForm();
    }
    hadBalancesRef.current = hasBalances;
  }, [formState, highestBalance, onShowForm]);

  const handleDeposit = (deposit: Deposit) => {
    if (!dydxAddress) return;

    onDeposit({ txHash: deposit.txHash, chainId: deposit.chainId });
    dispatch(addDeposit({ deposit, dydxAddress }));
  };

  return (
    <div tw="h-full w-full overflow-hidden">
      <div tw="flex h-full w-[300%]">
        <div
          tw="w-[33.33%]"
          css={{
            marginLeft:
              formState === 'form' ? 0 : formState === 'token-select' ? '-33.33%' : '-66.66%',
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
          tw="w-[33.33%] overflow-scroll"
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
            onWalletAddressDeposit={
              canDepositToWalletAddress ? () => setFormState('wallet-address') : undefined
            }
          />
        </div>

        <div
          tw="w-[33.33%] overflow-scroll"
          css={{
            pointerEvents: formState !== 'wallet-address' ? 'none' : undefined,
            height: formState !== 'wallet-address' ? 0 : '100%',
            maxHeight: isMobile ? undefined : '30rem',
          }}
        >
          {canDepositToWalletAddress && <WalletAddressDeposit />}
        </div>
      </div>
    </div>
  );
};
