import { useLayoutEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { mainnet } from 'viem/chains';

import { DepositDialog2Props, DialogProps, DialogTypes } from '@/constants/dialogs';
import { CosmosChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TokenForTransfer, USDC_ADDRESSES, USDC_DECIMALS } from '@/constants/tokens';
import { ConnectorType, WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { addDeposit, Deposit } from '@/state/transfers';
import { SourceAccount } from '@/state/wallet';

import { DepositForm } from './DepositForm';
import { DepositStatus } from './DepositStatus';
import { QrDeposit } from './QrDeposit';
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

  return {
    chainId: CosmosChainId.Osmosis,
    denom: USDC_ADDRESSES[CosmosChainId.Osmosis],
    decimals: USDC_DECIMALS,
  };
}

type DepositFormState = 'form' | 'token-select' | 'qr-deposit';

export const DepositDialog2 = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const dispatch = useAppDispatch();
  const { sourceAccount, dydxAddress } = useAccounts();

  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenForTransfer>(getDefaultToken(sourceAccount));
  const [currentDeposit, setCurrentDeposit] = useState<{ txHash: string; chainId: string }>();

  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

  const [formState, setFormState] = useState<DepositFormState>('form');
  const tokenSelectRef = useRef<HTMLDivElement | null>(null);

  const dialogTitle = (
    {
      form: stringGetter({ key: STRING_KEYS.DEPOSIT }),
      'token-select': stringGetter({ key: STRING_KEYS.SELECT_TOKEN }),
      'qr-deposit': stringGetter({ key: STRING_KEYS.QR_DEPOSIT }),
    } satisfies Record<DepositFormState, string>
  )[formState];

  const onDeposit = (deposit: Deposit) => {
    if (!dydxAddress) return;

    setCurrentDeposit({ txHash: deposit.txHash, chainId: deposit.chainId });
    dispatch(addDeposit({ deposit, dydxAddress }));
  };

  const onShowForm = () => {
    setFormState('form');
    tokenSelectRef.current?.scroll({ top: 0 });
  };

  const onShowQrDeposit = () => {
    setFormState('qr-deposit');
    tokenSelectRef.current?.scroll({ top: 0 });
  };

  const onBack = () => {
    if (formState === 'token-select') {
      onShowForm();
    } else {
      setFormState('token-select');
    }
  };

  useLayoutEffect(() => {
    if (sourceAccount.walletInfo?.connectorType === ConnectorType.Privy) {
      setIsOpen(false);
      dispatch(openDialog(DialogTypes.CoinbaseDepositDialog({})));
    }
  }, [sourceAccount, dispatch, setIsOpen]);

  return (
    <$Dialog
      isOpen
      preventCloseOnOverlayClick
      withAnimation
      hasHeaderBorder
      setIsOpen={setIsOpen}
      onBack={formState === 'form' ? undefined : onBack}
      title={dialogTitle}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
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
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;

  --asset-icon-chain-icon-borderColor: var(--dialog-backgroundColor);
`;
