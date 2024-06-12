import styled from 'styled-components';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const StakingPanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { stakingLearnMore } = useURLConfigs();

  return (
    <$Panel
      className={className}
      slotHeaderContent={
        <$Header>
          <$Title>{stringGetter({ key: STRING_KEYS.STAKE_WITH_KEPLR })}</$Title>
          <$Img src="/third-party/keplr.png" alt={stringGetter({ key: STRING_KEYS.KEPLR })} />
        </$Header>
      }
      onClick={() => dispatch(openDialog(DialogTypes.ExternalNavKeplr()))}
    >
      <$Description>
        {stringGetter({ key: STRING_KEYS.STAKING_DESCRIPTION })}
        <Link href={stakingLearnMore} onClick={(e) => e.stopPropagation()}>
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
        </Link>
      </$Description>
    </$Panel>
  );
};
const $Panel = styled(Panel)`
  align-items: start;

  header {
    justify-content: unset;
    padding-bottom: 0;
  }
`;

const $Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const $Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
`;

const $Img = styled.img`
  width: 2rem;
  height: 2rem;
  margin-left: 0.5rem;
`;

const $Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    ::before {
      content: ' ';
    }
  }
`;
