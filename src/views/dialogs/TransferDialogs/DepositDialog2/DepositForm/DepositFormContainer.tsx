import { Dispatch, RefObject, SetStateAction, useState } from 'react';

import { TokenForTransfer } from '@/constants/tokens';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useCustomNotification } from '@/hooks/useCustomNotification';

import SignalIcon from '@/icons/signal.svg';

import { Link } from '@/components/Link';

import { useAppDispatch } from '@/state/appTypes';
import { addDeposit, Deposit } from '@/state/transfers';

import { DepositForm } from './DepositForm';
import { DepositStatus } from './DepositStatus';
import { QrDeposit } from './QrDeposit';
import { TokenSelect } from './TokenSelect';

export type DepositFormState = 'form' | 'token-select' | 'qr-deposit';

export const DepositFormContent = ({
  defaultToken,
  formState,
  onShowForm,
  setFormState,
  setIsOpen,
  tokenSelectRef,
}: {
  defaultToken: TokenForTransfer;
  formState: 'form' | 'token-select' | 'qr-deposit';
  onShowForm: () => void;
  setFormState: Dispatch<SetStateAction<DepositFormState>>;
  setIsOpen: (isOpen: boolean) => void;
  tokenSelectRef: RefObject<HTMLDivElement>;
}) => {
  const dispatch = useAppDispatch();
  const { dydxAddress } = useAccounts();
  const { isMobile } = useBreakpoints();
  const notify = useCustomNotification();
  // const stringGetter = useStringGetter();

  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenForTransfer>(defaultToken);
  const [currentDeposit, setCurrentDeposit] = useState<{ txHash: string; chainId: string }>();

  const onShowQrDeposit = () => {
    setFormState('qr-deposit');
    tokenSelectRef.current?.scroll({ top: 0 });
  };

  const onDeposit = (deposit: Deposit) => {
    if (!dydxAddress) return;

    setCurrentDeposit({ txHash: deposit.txHash, chainId: deposit.chainId });
    dispatch(addDeposit({ deposit, dydxAddress }));

    notify({
      slotTitleLeft: <SignalIcon />,
      title: 'Deposit Detected', // TODO: add to v4-localization --> stringGetter({ key: STRING_KEYS.DEPOSIT_DETECTED_BODY }),
      body: 'Your deposit will arrive in ~30 sec',
      actionDescription: 'View Transaction',
      renderActionSlot: () => (
        <Link href={deposit.explorerLink} isAccent>
          View Transaction
        </Link>
      ),
    });
  };

  return (
    <>
      {currentDeposit && (
        <DepositStatus
          onClose={() => setIsOpen(false)}
          txHash={currentDeposit.txHash}
          chainId={currentDeposit.chainId}
        />
      )}

      {!currentDeposit && (
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
                onDeposit={onDeposit}
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
                onQrDeposit={onShowQrDeposit}
                token={token}
                setToken={setToken}
                onBack={onShowForm}
              />
            </div>

            <div
              tw="w-[33.33%] overflow-scroll"
              css={{
                pointerEvents: formState !== 'qr-deposit' ? 'none' : undefined,
                height: formState !== 'qr-deposit' ? 0 : '100%',
                maxHeight: isMobile ? undefined : '30rem',
              }}
            >
              <QrDeposit disabled={formState !== 'qr-deposit'} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
