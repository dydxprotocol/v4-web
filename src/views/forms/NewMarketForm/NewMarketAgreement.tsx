import { useState } from 'react';

import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Link } from '@/components/Link';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

export const NewMarketAgreement = ({
  onAccept,
  onCancel,
}: {
  onAccept: () => void;
  onCancel: () => void;
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const stringGetter = useStringGetter();

  return (
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
      <div tw="grid grid-cols-[1fr_2fr] gap-1">
        <Button action={ButtonAction.Base} onClick={onCancel}>
          {stringGetter({ key: STRING_KEYS.CANCEL })}
        </Button>
        <Button
          action={ButtonAction.Primary}
          onClick={() => {
            onAccept();
          }}
          state={{ isDisabled: !hasAcknowledged }}
        >
          {stringGetter({ key: STRING_KEYS.CONTINUE })}
        </Button>
      </div>
    </$Content>
  );
};

const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;

  p {
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: var(--color-layer-1);
  }
`;
