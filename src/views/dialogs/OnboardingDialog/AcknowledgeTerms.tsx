import styled, { type AnyStyledComponent } from 'styled-components';

import { useAccounts, useStringGetter } from '@/hooks';

import { AppRoute } from '@/constants/routes';
import { STRING_KEYS } from '@/constants/localization';
import { ButtonAction } from '@/constants/buttons';

import { Button } from '@/components/Button';
import { Link } from '@/components/Link';

type ElementProps = {
  onContinue?: () => void;
};

export const AcknowledgeTerms = ({ onContinue }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { saveHasAcknowledgedTerms } = useAccounts();

  const onAcknowledgement = () => {
    saveHasAcknowledgedTerms(true);
    onContinue?.();
  };

  return (
    <>
      <span>
        {stringGetter({
          key: STRING_KEYS.LEGAL_UPDATES_DESCRIPTION,
          params: {
            TOU: (
              <Styled.Link href={`/#${AppRoute.Terms}`}>
                {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
              </Styled.Link>
            ),
            PRIVACY_POLICY: (
              <Styled.Link href={`/#${AppRoute.Privacy}`}>
                {stringGetter({ key: STRING_KEYS.PRIVACY_POLICY })}
              </Styled.Link>
            ),
          },
        })}
      </span>
      <Button onClick={onAcknowledgement} action={ButtonAction.Primary}>
        {stringGetter({ key: STRING_KEYS.I_AGREE })}
      </Button>
    </>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Link = styled(Link)`
  display: inline-block;
  color: var(--color-accent);

  &:visited {
    color: var(--color-accent);
  }
`;
