import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStakingAPR } from '@/hooks/useStakingAPR';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';
import { Tag, TagSign } from '@/components/Tag';
import { StakeForm } from '@/views/forms/StakeForm';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const StakeDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { chainTokenLabel } = useTokenConfigs();
  const stakingApr = useStakingAPR();

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={<AssetIcon symbol={chainTokenLabel} />}
      title={
        <$Title>
          {stringGetter({ key: STRING_KEYS.STAKE })}
          {stakingApr && (
            <$Tag sign={TagSign.Positive}>
              {stringGetter({
                key: STRING_KEYS.EST_APR,
                params: { PERCENTAGE: <$Output type={OutputType.Percent} value={stakingApr} /> },
              })}
            </$Tag>
          )}
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

const $Tag = styled(Tag)`
  display: inline-block;
`;

const $Output = styled(Output)`
  display: inline-block;
`;
