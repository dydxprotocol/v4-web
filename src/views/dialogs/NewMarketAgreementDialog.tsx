import { useState } from 'react';

import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { DialogProps, NewMarketAgreementDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Dialog } from '@/components/Dialog';
import { Link } from '@/components/Link';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

export const NewMarketAgreementDialog = ({
  acceptTerms,
  setIsOpen,
}: DialogProps<NewMarketAgreementDialogProps>) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const stringGetter = useStringGetter();

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.ACKNOWLEDGEMENT })}
    >
      <$Content>
        <p>
          {stringGetter({
            key: STRING_KEYS.NEW_MARKET_PROPOSAL_AGREEMENT,
            params: {
              DOCUMENTATION_LINK: (
                <Link
                  href="https://docs.dydx.community/dydx-governance/voting-and-governance/governance-process"
                  withIcon
                  isAccent
                  isInline
                >
                  {stringGetter({ key: STRING_KEYS.WEBSITE }).toLowerCase()}
                </Link>
              ),
              TERMS_OF_USE: <TermsOfUseLink isInline isAccent />,
            },
          })}
        </p>

        <Checkbox
          checked={hasAcknowledged}
          onCheckedChange={setHasAcknowledged}
          id="acknowledgement-checkbox"
          label={stringGetter({ key: STRING_KEYS.I_HAVE_READ_AND_AGREE })}
        />
        <$ButtonRow>
          <Button action={ButtonAction.Base} onClick={() => setIsOpen(false)}>
            {stringGetter({ key: STRING_KEYS.CANCEL })}
          </Button>
          <Button
            action={ButtonAction.Primary}
            onClick={() => {
              acceptTerms();
              setIsOpen(false);
            }}
            state={{ isDisabled: !hasAcknowledged }}
          >
            {stringGetter({ key: STRING_KEYS.CONTINUE })}
          </Button>
        </$ButtonRow>
      </$Content>
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)`
  @media ${breakpoints.notMobile} {
    --dialog-width: 30rem;
  }
`;

const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;

  p {
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: var(--color-layer-1);
  }
`;

const $ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
`;
