import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Panel } from '@/components/Panel';

import { Stake } from './Stake';

export const SwapAndStakingPanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();

  return (
    <Panel
      className={className}
      slotHeader={
        <$Header>
          <$HeaderTitle>{stringGetter({ key: STRING_KEYS.STAKE })}</$HeaderTitle>
        </$Header>
      }
    >
      <Stake />
    </Panel>
  );
};

const $Header = styled.header`
  display: flex;
  gap: 1.25rem;
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  font-size: 1.125rem;
  font-weight: bold;
`;

const $HeaderTitle = styled.span`
  color: var(--color-text-2);
`;
