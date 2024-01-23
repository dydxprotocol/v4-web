import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { LinkOutIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
 
type NewMarketSuccessStepProps = {
   href: string;
};

 export const NewMarketSuccessStep = ({ href }: NewMarketSuccessStepProps) => {
   return (
     <Styled.ProposalSent>
       <Styled.OuterCircle>
         <Styled.InnerCircle>
           <Icon iconName={IconName.Check} />
         </Styled.InnerCircle>
       </Styled.OuterCircle>
       <h2>Submitted Proposal!</h2>
       <span>Your proposal has been successfully submitted onchain.</span>
       <Button type={ButtonType.Link} href="https://google.com" action={ButtonAction.Primary}>
           View proposal
           <LinkOutIcon />
         </Button>
     </Styled.ProposalSent>
   );
 };

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ProposalSent = styled.div`
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

Styled.OuterCircle = styled.div`
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

Styled.InnerCircle = styled.div`
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
