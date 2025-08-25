import { useState } from 'react';

import styled from 'styled-components';

import { CHAIN_INFO, EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { QrCode } from '@/components/QrCode';
import { SelectItem, SelectMenu } from '@/components/SelectMenu';

export const DepositAddressDialog = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const [selectedChain, setSelectedChain] = useState('1');
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

  return (
    <$Dialog
      isOpen
      preventCloseOnOverlayClick
      withAnimation
      hasHeaderBorder
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <div>
        <div>
          <div>Spot</div>
          <div>Perpetuals</div>
        </div>
        <SelectMenu
          value={selectedChain}
          onValueChange={setSelectedChain}
          label={stringGetter({ key: STRING_KEYS.SELECTED_VALIDATOR })}
          withPortal={false}
        >
          {EVM_DEPOSIT_CHAINS.map(({ id }) => (
            <SelectItem key={id} value={id.toString()} label={CHAIN_INFO[id]?.name} />
          ))}
        </SelectMenu>

        <$AddressCard>
          <div tw="flexColumn min-w-0 justify-between">
            <img
              tw="size-2.25"
              src={CHAIN_INFO[selectedChain]?.icon}
              alt={CHAIN_INFO[selectedChain]?.name}
            />
            <div tw="min-w-0 whitespace-normal break-words">
              <span tw="text-color-text-2">0x321</span>
              <span tw="text-color-text-0">321o4128371289471289372981739821321321</span>
              <span tw="text-color-text-2">4214d</span>
            </div>
          </div>
          <div tw="flex size-[155px] max-w-[155px]">
            <QrCode hasLogo tw="size-full" value="0x321321o4128371289471289372981739821321321" />
          </div>
        </$AddressCard>

        <span tw="text-color-warning">
          Only deposit USDC or ETH on Ethereum network. Funds sent to any other networks can result
          in a loss of funds.
        </span>
      </div>
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

const $AddressCard = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  padding: 0.5rem;
  gap: 2rem;
`;
