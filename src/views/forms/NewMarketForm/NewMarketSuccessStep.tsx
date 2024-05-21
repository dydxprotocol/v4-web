import styled from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

type NewMarketSuccessStepProps = {
  href: string;
};

export const NewMarketSuccessStep = ({ href }: NewMarketSuccessStepProps) => {
  const stringGetter = useStringGetter();

  return (
    <$ProposalSent>
      <$OuterCircle>
        <$InnerCircle>
          <Icon iconName={IconName.Check} />
        </$InnerCircle>
      </$OuterCircle>
      <h2>{stringGetter({ key: STRING_KEYS.SUBMITTED_PROPOSAL })}</h2>
      <span>{stringGetter({ key: STRING_KEYS.PROPOSAL_SUBMISSION_SUCCESSFUL })}</span>
      <Button type={ButtonType.Link} href={href} action={ButtonAction.Primary}>
        {stringGetter({ key: STRING_KEYS.VIEW_PROPOSAL })}
        <LinkOutIcon />
      </Button>
    </$ProposalSent>
  );
};
const $ProposalSent = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;

  && {
    h2 {
      margin: 0 1rem;
    }
  }
`;

const $OuterCircle = styled.div`
  width: 5.25rem;
  height: 5.25rem;
  min-width: 5.25rem;
  height: 5.25rem;
  border-radius: 50%;
  background-color: var(--color-gradient-positive);

  display: flex;
  align-items: center;
  justify-content: center;
`;

const $InnerCircle = styled.div`
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--color-success);

  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: var(--color-layer-2);
  }
`;
