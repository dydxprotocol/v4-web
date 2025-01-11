import { useRef, useState } from 'react';

import styled from 'styled-components';

import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { ChainSelect } from './ChainSelect';
import { WithdrawForm } from './WithdrawForm';

export const WithdrawDialog2 = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationChain, setDestinationChain] = useState('');
  const [amount, setAmount] = useState('');

  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

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
      <div tw="flex w-[200%] overflow-hidden">
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
          />
        </div>
        <div
          ref={chainSelectRef}
          tw="w-[50%] overflow-scroll"
          style={{
            height: formState === 'form' ? 0 : '100%',
            maxHeight: isMobile ? '50vh' : '25rem',
          }}
        >
          <ChainSelect
            selectedChain={destinationChain}
            setSelectedChain={setDestinationChain}
            onBack={onShowForm}
          />
        </div>
      </div>
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;
`;
