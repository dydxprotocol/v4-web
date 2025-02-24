import { useState } from 'react';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { CoinbaseDepositDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { CopyIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { QrCode } from '@/components/QrCode';

const THREE_SECOND_DELAY = 3000;
export const CoinbaseDepositDialog = ({
  onBack,
  setIsOpen,
}: DialogProps<CoinbaseDepositDialogProps>) => {
  const stringGetter = useStringGetter();
  const [showCopyLogo, setShowCopyLogo] = useState(true);
  const { nobleAddress } = useAccounts();

  const onCopy = () => {
    if (!nobleAddress) return;

    setShowCopyLogo(false);
    navigator.clipboard.writeText(nobleAddress);
    setTimeout(() => setShowCopyLogo(true), THREE_SECOND_DELAY);
  };

  return (
    <Dialog
      isOpen
      hasHeaderBorder
      onBack={onBack}
      setIsOpen={setIsOpen}
      title={<div tw="text-center">{stringGetter({ key: STRING_KEYS.DEPOSIT_VIA_COINBASE })}</div>}
    >
      <div tw="flex flex-col gap-0.5 px-0.5 pt-1.25">
        <div tw="text-center text-color-text-0">
          {stringGetter({
            key: STRING_KEYS.TO_DEPOSIT_FROM_COINBASE,
            params: {
              ASSET: <span tw="text-color-text-1">USDC</span>,
              NETWORK: <span tw="text-color-text-1">Noble Network</span>,
            },
          })}
        </div>
        <div tw="self-center" style={{ height: 200, width: 200 }}>
          <QrCode tw="text-center" hasLogo size={200} value={nobleAddress ?? ''} />
        </div>
        <div tw="flex items-center justify-between gap-0.5 self-stretch rounded-0.5 bg-color-layer-2 px-1 py-0.5">
          <div tw="text-color-text-0">{nobleAddress}</div>
          <button onClick={onCopy} tw="flex items-center" type="button">
            <div tw="sr-only">{stringGetter({ key: STRING_KEYS.COPY })}</div>
            {showCopyLogo ? <CopyIcon /> : <GreenCheckCircle />}
          </button>
        </div>
        <div tw="rounded-0.5 border border-solid border-color-border p-0.5 text-small">
          {stringGetter({ key: STRING_KEYS.NOBLE_CHAIN_ONLY })}
        </div>
        <Button
          tw="bg-color-layer-4"
          action={ButtonAction.Secondary}
          onClick={() => setIsOpen(false)}
          type={ButtonType.Submit}
        >
          {stringGetter({ key: STRING_KEYS.CLOSE })}
        </Button>
      </div>
    </Dialog>
  );
};
