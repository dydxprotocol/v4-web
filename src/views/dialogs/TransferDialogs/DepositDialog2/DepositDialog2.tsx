import { useLayoutEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { mainnet } from 'viem/chains';

import { DepositDialog2Props, DialogProps, DialogTypes } from '@/constants/dialogs';
import { CosmosChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { TokenBalance, TokenForTransfer, USDC_ADDRESSES, USDC_DECIMALS } from '@/constants/tokens';
import { ConnectorType, WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useEnableSpot } from '@/hooks/useEnableSpot';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { SpotTabItem, SpotTabs } from '@/pages/spot/SpotTabs';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { SourceAccount } from '@/state/wallet';

import { DepositFormContent, DepositFormState } from './DepositForm/DepositFormContainer';
import { DepositStatus } from './DepositForm/DepositStatus';
import { SpotDepositForm } from './SpotDepositForm';
import { useDepositTokenBalances } from './queries';

function getDefaultToken(
  sourceAccount: SourceAccount,
  highestBalance?: TokenBalance
): TokenForTransfer {
  if (!sourceAccount.chain) throw new Error('No user chain detected');

  if (highestBalance && highestBalance.decimals != null) {
    return {
      chainId: highestBalance.chainId,
      decimals: highestBalance.decimals,
      denom: highestBalance.denom,
    };
  }

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
  const dispatch = useAppDispatch();
  const { sourceAccount, solanaAddress } = useAccounts();
  const { isLoading: isLoadingBalances, withBalances } = useDepositTokenBalances();
  const highestBalance = withBalances.at(0);

  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();
  const isSpotEnabled = useEnableSpot();

  const [currentDepositType, setCurrentDepositType] = useState<'perps' | 'spot'>('perps');
  const [formState, setFormState] = useState<DepositFormState>('form');
  const [currentPerpsDeposit, setCurrentPerpsDeposit] = useState<{
    txHash: string;
    chainId: string;
  }>();
  const tokenSelectRef = useRef<HTMLDivElement | null>(null);

  const handleTabChange = (newTab: 'perps' | 'spot') => {
    setCurrentDepositType(newTab);
    setFormState('form');
  };

  const dialogTitle = (
    {
      form: stringGetter({ key: STRING_KEYS.DEPOSIT }),
      'token-select': stringGetter({ key: STRING_KEYS.SELECT_TOKEN }),
      'qr-deposit': stringGetter({ key: STRING_KEYS.QR_DEPOSIT }),
    } satisfies Record<DepositFormState, string>
  )[formState];

  const onShowForm = () => {
    setFormState('form');
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

  const tabs: SpotTabItem[] = [
    {
      value: 'perps',
      label: 'Perpetuals',
      content: isLoadingBalances ? (
        <div tw="flex h-full w-full items-center justify-center overflow-hidden">
          <LoadingSpace tw="my-4" />
        </div>
      ) : (
        <DepositFormContent
          defaultToken={getDefaultToken(sourceAccount, highestBalance)}
          formState={formState}
          setFormState={setFormState}
          onDeposit={setCurrentPerpsDeposit}
          tokenSelectRef={tokenSelectRef}
          onShowForm={onShowForm}
        />
      ),
    },
    {
      value: 'spot',
      label: 'Spot',
      content: <SpotDepositForm />,
    },
  ];

  return (
    <$Dialog
      isOpen
      preventCloseOnOverlayClick
      withAnimation
      setIsOpen={setIsOpen}
      onBack={formState === 'form' || currentDepositType === 'spot' ? undefined : onBack}
      title={dialogTitle}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
      hasHeaderBorder
    >
      {currentPerpsDeposit ? (
        <DepositStatus
          onClose={() => setIsOpen(false)}
          txHash={currentPerpsDeposit.txHash}
          chainId={currentPerpsDeposit.chainId}
        />
      ) : (
        <div tw="h-full w-full p-1.25">
          <SpotTabs
            value={currentDepositType}
            onValueChange={(v) => handleTabChange(v as 'perps' | 'spot')}
            hideTabs={formState !== 'form' || !isSpotEnabled || !solanaAddress}
            items={tabs}
          />
        </div>
      )}
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --asset-icon-chain-icon-borderColor: var(--dialog-backgroundColor);
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;
`;
