import { UnstakeForm } from '@/forms/UnstakeForm';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const UnstakeDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { chainTokenLabel } = useTokenConfigs();

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={<AssetIcon symbol={chainTokenLabel} />}
      title={stringGetter({ key: STRING_KEYS.UNSTAKE })}
    >
      <UnstakeForm onDone={() => setIsOpen?.(false)} />
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
`;
