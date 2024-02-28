import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { DydxChainAsset } from '@/constants/wallets';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';
import { TransferForm } from '@/views/forms/TransferForm';

type ElementProps = {
  selectedAsset?: DydxChainAsset;
  setIsOpen?: (open: boolean) => void;
};

export const TransferDialog = ({ selectedAsset, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <$Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.TRANSFER })}>
      <TransferForm selectedAsset={selectedAsset} onDone={() => setIsOpen?.(false)} />
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
`;
