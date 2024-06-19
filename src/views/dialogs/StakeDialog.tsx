import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { Tag, TagSign } from '@/components/Tag';
import { StakeForm } from '@/views/forms/StakeForm';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const StakeDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { chainTokenLabel } = useTokenConfigs();
  const apr = 16.94; /* OTE-406: Hardcoded for now until I get the APY endpoint working */

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={<AssetIcon symbol={chainTokenLabel} />}
      title={
        <$Title>
          {stringGetter({ key: STRING_KEYS.STAKE })}
          <Tag sign={TagSign.Positive}>
            {stringGetter({ key: STRING_KEYS.EST_APR, params: { PERCENTAGE: apr } })}
          </Tag>
        </$Title>
      }
    >
      <StakeForm onDone={() => setIsOpen?.(false)} />
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
`;

const $Title = styled.span`
  ${layoutMixins.inlineRow}
`;
