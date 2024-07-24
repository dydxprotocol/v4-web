import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction } from '@/constants/buttons';
import { AcknowledgeTermsDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Link } from '@/components/Link';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

export const AcknowledgeTermsDialog = ({ setIsOpen }: DialogProps<AcknowledgeTermsDialogProps>) => {
  const stringGetter = useStringGetter();
  const { saveHasAcknowledgedTerms } = useAccounts();

  const onAcknowledgement = () => {
    saveHasAcknowledgedTerms(true);
    setIsOpen(false);
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS })}
    >
      <div tw="flexColumn gap-1">
        <p>
          {stringGetter({
            key: STRING_KEYS.TOS_TITLE,
            params: {
              TERMS_LINK: <TermsOfUseLink isInline />,
              PRIVACY_POLICY_LINK: (
                <Link href={`${BASE_ROUTE}${AppRoute.Privacy}`} isInline isAccent>
                  {stringGetter({ key: STRING_KEYS.PRIVACY_POLICY })}
                </Link>
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
      </div>
    </Dialog>
  );
};
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

const $Button = tw(Button)`grow `;
