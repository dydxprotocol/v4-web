import { useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DydxChainAsset } from '@/constants/wallets';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';
import { useAccounts, useStringGetter } from '@/hooks';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';
import { SelectItem, SelectMenu } from '@/components/SelectMenu';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { truncateAddress } from '@/lib/wallet';

import { OnboardingTriggerButton } from './OnboardingTriggerButton';

type ElementProps = {
  selectedAsset?: DydxChainAsset;
  setIsOpen: (open: boolean) => void;
};

export const ReceiveDialog = ({ selectedAsset = DydxChainAsset.DYDX, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();

  const [asset, setAsset] = useState(selectedAsset);
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    if (!dydxAddress) return;
    setCopied(true);
    navigator.clipboard.writeText(dydxAddress);
    setTimeout(() => setCopied(false), 500);
  };

  const assetOptions = [
    {
      value: DydxChainAsset.USDC,
      label: (
        <Styled.InlineRow>
          <AssetIcon symbol="USDC" /> USDC
        </Styled.InlineRow>
      ),
    },
    {
      value: DydxChainAsset.DYDX,
      label: (
        <Styled.InlineRow>
          {/* <AssetIcon symbol="DYDX" />  */}
          Dv4TNT
        </Styled.InlineRow>
      ),
    },
  ];

  return (
    <Styled.Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.RECEIVE })}>
      <Styled.Content>
        <Styled.SelectMenu
          label={stringGetter({ key: STRING_KEYS.ASSET })}
          value={asset}
          onValueChange={setAsset}
        >
          {assetOptions.map(({ value, label }) => (
            <Styled.SelectItem key={value} value={value} label={label} />
          ))}
        </Styled.SelectMenu>

        {!dydxAddress ? (
          <OnboardingTriggerButton />
        ) : (
          <>
            <Styled.WithDetailsReceipt
              side="bottom"
              detailItems={[
                {
                  key: 'address',
                  label: stringGetter({ key: STRING_KEYS.DYDX_CHAIN_ADDRESS }),
                  value: truncateAddress(dydxAddress),
                },
              ]}
            >
              <QrCode hasLogo value={dydxAddress!} />
            </Styled.WithDetailsReceipt>
            <Button action={copied ? ButtonAction.Create : ButtonAction.Primary} onClick={onCopy}>
              <Icon iconName={IconName.Copy} />
              {stringGetter({ key: copied ? STRING_KEYS.COPIED : STRING_KEYS.COPY_ADDRESS })}
            </Button>
          </>
        )}
      </Styled.Content>
    </Styled.Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
  --dialog-width: 20rem;
`;

Styled.Content = styled.div`
  ${formMixins.inputsColumn}
  gap: 1.25rem;
`;

Styled.SelectMenu = styled(SelectMenu)`
  ${formMixins.inputSelectMenu}
  --form-input-height: 3.5rem;
`;

Styled.SelectItem = styled(SelectItem)`
  ${formMixins.inputSelectMenuItem}
`;

Styled.InlineRow = styled.span`
  ${layoutMixins.inlineRow}
  height: 100%;

  img {
    font-size: 1.1em;
  }
`;

Styled.WithDetailsReceipt = styled(WithDetailsReceipt)`
  border-radius: 0.75em;
`;
