import { useRef, useState } from 'react';

import styled from 'styled-components';
import { mainnet } from 'viem/chains';

import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { CosmosChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { WalletNetworkType, WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { useAppDispatch } from '@/state/appTypes';
import {
  addWithdraw,
  onWithdrawBroadcast,
  Withdraw,
  WithdrawSubtransaction,
} from '@/state/transfers';

import { ChainSelect } from './ChainSelect';
import { WithdrawForm } from './WithdrawForm';
import { WithdrawStatus } from './WithdrawStatus';

export const WithdrawDialog2 = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const { dydxAddress, sourceAccount } = useAccounts();
  const isPrivy = sourceAccount.walletInfo?.name === WalletType.Privy;
  const [destinationAddress, setDestinationAddress] = useState(
    isPrivy ? '' : sourceAccount.address ?? ''
  );

  const { isMobile } = useBreakpoints();
  const [destinationChain, setDestinationChain] = useState(
    sourceAccount.chain === WalletNetworkType.Evm
      ? mainnet.id.toString()
      : sourceAccount.chain === SOLANA_MAINNET_ID
        ? SOLANA_MAINNET_ID
        : CosmosChainId.Noble
  );

  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');
  const [currentWithdrawId, setCurrentWithdrawId] = useState<string>();
  const [formState, setFormState] = useState<'form' | 'chain-select'>('form');
  const chainSelectRef = useRef<HTMLDivElement | null>(null);

  const dialogTitle =
    formState === 'form'
      ? stringGetter({ key: STRING_KEYS.WITHDRAW })
      : stringGetter({ key: STRING_KEYS.SELECT_CHAIN });

  const onShowForm = () => {
    setFormState('form');
    chainSelectRef.current?.scroll({ top: 0 });
  };

  const onWithdrawSigned = (withdrawId: string) => {
    setCurrentWithdrawId(withdrawId);
  };

  const onWithdraw = (withdraw: Withdraw) => {
    if (!dydxAddress) return;
    dispatch(addWithdraw({ withdraw, dydxAddress }));
  };

  const onWithdrawBroadcastUpdate = (
    withdrawId: string,
    subtransaction: WithdrawSubtransaction
  ) => {
    if (!dydxAddress) return;
    dispatch(onWithdrawBroadcast({ dydxAddress, withdrawId, subtransaction }));
  };

  return (
    <$Dialog
      isOpen
      withAnimation
      hasHeaderBorder
      setIsOpen={setIsOpen}
      onBack={formState !== 'form' ? onShowForm : undefined}
      title={dialogTitle}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      {currentWithdrawId && (
        <WithdrawStatus id={currentWithdrawId} onClose={() => setIsOpen(false)} />
      )}
      {!currentWithdrawId && (
        <div tw="h-full w-full overflow-hidden">
          <div tw="flex h-full w-[200%]">
            <div
              tw="w-[50%]"
              style={{ marginLeft: formState === 'form' ? 0 : '-50%', transition: 'margin 500ms' }}
            >
              <WithdrawForm
                amount={amount}
                setAmount={setAmount}
                destinationAddress={destinationAddress}
                setDestinationAddress={setDestinationAddress}
                destinationChain={destinationChain}
                onChainSelect={() => setFormState('chain-select')}
                onWithdraw={onWithdraw}
                onWithdrawBroadcastUpdate={onWithdrawBroadcastUpdate}
                onWithdrawSigned={onWithdrawSigned}
              />
            </div>
            <div
              ref={chainSelectRef}
              tw="w-[50%] overflow-scroll"
              style={{
                pointerEvents: formState === 'form' ? 'none' : undefined,
                height: formState === 'form' ? 0 : '100%',
              }}
            >
              <ChainSelect
                disabled={formState === 'form'}
                selectedChain={destinationChain}
                setSelectedChain={setDestinationChain}
                onBack={onShowForm}
              />
            </div>
          </div>
        </div>
      )}
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;
`;
