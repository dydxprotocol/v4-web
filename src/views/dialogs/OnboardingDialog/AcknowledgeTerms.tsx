import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useAccounts, useStringGetter } from '@/hooks';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Link } from '@/components/Link';

type ElementProps = {
  onClose?: () => void;
  onContinue?: () => void;
};

export const AcknowledgeTerms = ({ onClose, onContinue }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { saveHasAcknowledgedTerms } = useAccounts();

  const onAcknowledgement = () => {
    saveHasAcknowledgedTerms(true);
    onContinue?.();
  };

  return (
    <>
      <p>
        {stringGetter({
          key: STRING_KEYS.TOS_TITLE,
          params: {
            TERMS_LINK: (
              <$Link href={`${BASE_ROUTE}${AppRoute.Terms}`}>
                {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
              </$Link>
            ),
            PRIVACY_POLICY_LINK: (
              <$Link href={`${BASE_ROUTE}${AppRoute.Privacy}`}>
                {stringGetter({ key: STRING_KEYS.PRIVACY_POLICY })}
              </$Link>
            ),
          },
        })}
      </p>
      <$TOS>
        <ul>
          <li>{stringGetter({ key: STRING_KEYS.TOS_LINE1 })}</li>
          <li>{stringGetter({ key: STRING_KEYS.TOS_LINE2 })}</li>
          <li>{stringGetter({ key: STRING_KEYS.TOS_LINE3 })}</li>
          <li>{stringGetter({ key: STRING_KEYS.TOS_LINE4 })}</li>
          <li>{stringGetter({ key: STRING_KEYS.TOS_LINE5 })}</li>
        </ul>
      </$TOS>
      <$Footer>
        <$Button onClick={onClose} action={ButtonAction.Base}>
          {stringGetter({ key: STRING_KEYS.CLOSE })}
        </$Button>
        <$Button onClick={onAcknowledgement} action={ButtonAction.Primary}>
          {stringGetter({ key: STRING_KEYS.I_AGREE })}
        </$Button>
      </$Footer>
    </>
  );
};
const $Link = styled(Link)`
  display: inline-block;
  color: var(--color-accent);

  &:visited {
    color: var(--color-accent);
  }
`;

const $TOS = styled.section`
  background-color: var(--color-layer-4);
  padding: 1rem 1rem 1rem 2rem;
  border-radius: 0.875rem;
  > ul {
    ${layoutMixins.column};
    gap: 1rem;
  }
`;

const $Footer = styled.div`
  ${formMixins.footer};
  ${layoutMixins.row}

  gap: 1rem;
`;

const $Button = styled(Button)`
  flex-grow: 1;
`;
