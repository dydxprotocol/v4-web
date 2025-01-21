import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { mainnet } from 'viem/chains';

import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { CosmosChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { TokenForTransfer, USDC_ADDRESSES, USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { SourceAccount } from '@/state/wallet';

import { DepositForm } from './DepositForm';
import { TokenSelect } from './TokenSelect';

function getDefaultToken(sourceAccount: SourceAccount): TokenForTransfer {
  if (!sourceAccount.chain) throw new Error('No user chain detected');

  // TODO(deposit2.0): Use user's biggest balance as the default token
  if (sourceAccount.chain === WalletNetworkType.Evm) {
    return {
      chainId: mainnet.id.toString(),
      denom: USDC_ADDRESSES[mainnet.id],
      decimals: USDC_DECIMALS,
    };
  }

  if (sourceAccount.chain === WalletNetworkType.Solana) {
    return {
      chainId: SOLANA_MAINNET_ID,
      denom: USDC_ADDRESSES[SOLANA_MAINNET_ID],
      decimals: USDC_DECIMALS,
    };
  }

  return {
    chainId: CosmosChainId.Osmosis,
    denom: USDC_ADDRESSES[CosmosChainId.Osmosis],
    decimals: USDC_DECIMALS,
  };
}

export const DepositDialog2 = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const { sourceAccount } = useAccounts();

  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenForTransfer>(getDefaultToken(sourceAccount));
  const [broadcastedTx, setBroadcastedTx] = useState<{ txHash: string; chainId: string }>();
  const [txConfirmed, setTxConfirmed] = useState(false);

  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

  const [formState, setFormState] = useState<'form' | 'token-select'>('form');
  const tokenSelectRef = useRef<HTMLDivElement | null>(null);

  // TODO(deposit2): localization
  const dialogTitle =
    formState === 'form' ? stringGetter({ key: STRING_KEYS.DEPOSIT }) : 'Select Token';

  const onShowForm = () => {
    setFormState('form');
    tokenSelectRef.current?.scroll({ top: 0 });
  };

  const { skipClient } = useSkipClient();

  useEffect(() => {
    if (!broadcastedTx) return;

    skipClient.waitForTransaction({
      chainID: broadcastedTx.chainId,
      txHash: broadcastedTx.txHash,
      onTransactionTracked: async (txInfo) => {
        console.log('explorer link', txInfo.explorerLink);
        setTxConfirmed(true);
      },
    });
  }, [broadcastedTx, skipClient]);

  return (
    <$Dialog
      isOpen
      withAnimation
      hasHeaderBorder
      setIsOpen={setIsOpen}
      slotIcon={formState === 'form' && <div />} // Empty icon to help with center alignment of title
      onBack={formState !== 'form' ? onShowForm : undefined}
      title={<div tw="text-center">{dialogTitle}</div>}
      placement={DialogPlacement.Default}
    >
      {broadcastedTx && !txConfirmed && <div>Your transaction is pending...</div>}
      {broadcastedTx && txConfirmed && <div>DONE!</div>}
      {!broadcastedTx && (
        <div tw="w-[100%] overflow-hidden">
          <div tw="flex w-[200%]">
            <div
              tw="w-[50%]"
              style={{ marginLeft: formState === 'form' ? 0 : '-50%', transition: 'margin 500ms' }}
            >
              <DepositForm
                onDeposit={setBroadcastedTx}
                onClose={() => setIsOpen(false)}
                amount={amount}
                setAmount={setAmount}
                token={token}
                onTokenSelect={() => setFormState('token-select')}
              />
            </div>
            <div
              ref={tokenSelectRef}
              tw="w-[50%] overflow-scroll"
              style={{
                height: formState === 'form' ? 0 : '100%',
                maxHeight: isMobile ? '50vh' : '25rem',
              }}
            >
              <TokenSelect token={token} setToken={setToken} onBack={onShowForm} />
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
