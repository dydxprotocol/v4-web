import { useState } from 'react';

import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { MODERATE_DEBOUNCE_MS } from '@/constants/debounce';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';

import { truncateAddress } from '@/lib/wallet';

export const QrDeposit = ({ disabled }: { disabled: boolean }) => {
  const stringGetter = useStringGetter();
  const { nobleAddress } = useAccounts();
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = () => {
    if (!nobleAddress || nobleAddress.trim() === '') return;

    setIsCopied(true);
    navigator.clipboard.writeText(nobleAddress);
    setTimeout(() => setIsCopied(false), MODERATE_DEBOUNCE_MS);
  };

  const isDisabled = disabled || isCopied || nobleAddress == null || nobleAddress.trim() === '';

  return (
    <div tw="flex h-full flex-col gap-1 p-1.25">
      <span tw="text-center text-color-text-0 font-base-medium">
        {stringGetter({
          key: STRING_KEYS.TO_DEPOSIT_FROM_CEX,
          params: {
            ASSET: <span tw="text-color-text-1">USDC</span>,
            NETWORK: <span tw="text-color-text-1">Noble Network</span>,
          },
        })}
      </span>

      <$QrContainer>
        <QrCode
          imgOverride={{
            alt: 'Noble Chain',
            src: '/chains/noble.png',
          }}
          tw="text-center"
          hasLogo
          size={200}
          value={nobleAddress ?? ''}
        />
      </$QrContainer>

      <div tw="flexColumn items-center gap-0.5">
        <span>Your Noble address</span>

        <$CopyAddressButton disabled={isDisabled} onClick={onCopy}>
          <span>{truncateAddress(nobleAddress, 'noble')}</span>
          <Icon
            css={{
              color: isCopied ? 'var(--color-success)' : 'var(--color-text-1)',
            }}
            iconName={isCopied ? IconName.Check : IconName.Copy}
          />
        </$CopyAddressButton>
      </div>

      <div tw="flexColumn items-center">
        <span tw="row gap-0.25 text-color-warning">
          <Icon iconName={IconName.Warning} />
          <span>{stringGetter({ key: STRING_KEYS.ONLY_SEND_ON_NOBLE })}</span>
        </span>
      </div>

      <div tw="flexColumn mt-auto items-center">
        <Button tw="w-full" action={ButtonAction.Primary} state={{ isDisabled }} onClick={onCopy}>
          {stringGetter({ key: STRING_KEYS.COPY_NOBLE })}
        </Button>
      </div>
    </div>
  );
};

const $QrContainer = styled.div`
  width: 200px;
  height: 200px;
  align-self: center;

  @media ${breakpoints.mobile} {
    margin-top: 1.875rem;
    margin-bottom: 1.875rem;
  }
`;

const $CopyAddressButton = styled.button.attrs({
  type: 'button',
})`
  ${layoutMixins.row}
  width: fit-content;
  gap: 0.25rem;
  background-color: var(--color-layer-3);
  border-radius: 1rem;
  padding: 0.75rem;
`;
