import { useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { AppRoute } from '@/constants/routes';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';
import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Dialog } from '@/components/Dialog';
import { Link } from '@/components/Link';

type ElementProps = {
  acceptTerms: () => void;
  setIsOpen: (open: boolean) => void;
};

const legalString =
  'By checking this box, you acknowledge and understand that (a) the pre-populated list of markets does not reflect an endorsement of any particular asset or market, and should not be relied on as investment, legal or any other form of professional advice; (b) this list is not a recommendations of any specific market, and markets are included based on compatibility and functionality assessments from a technical standpoint using public data; and (c) you are encouraged to conduct your own research and consult qualified legal counsel to ensure compliance with the laws of any and all applicable jurisdictions. Additionally, you acknowledge and understand that by clicking “Propose new market”, you will create an on-chain governance proposal — more information about on-chain governance proposals can be found on dYdX Foundation’s documentation website, which is independent from and unaffiliated with the host and operator of this website. Use of this widget is prohibited in the U.S., Canada and sanctioned jurisdictions as described in the Terms of Use';

export const NewMarketAgreementDialog = ({ acceptTerms, setIsOpen }: ElementProps) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const stringGetter = useStringGetter();

  return (
    <Styled.Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.ACKNOWLEDGEMENT })}
    >
      <Styled.Content>
        <p>
          {stringGetter({
            key: STRING_KEYS.NEW_MARKET_PROPOSAL_AGREEMENT,
            params: {
              DOCUMENTATION_LINK: (
                <Styled.Link href="https://docs.dydx.community/dydx-governance/voting-and-governance/governance-process">
                  {stringGetter({ key: STRING_KEYS.WEBSITE }).toLowerCase()}
                </Styled.Link>
              ),
              TERMS_OF_USE: (
                <Styled.Link href={`/#${AppRoute.Terms}`}>
                  {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
                </Styled.Link>
              ),
            },
          })}
        </p>

        <Checkbox
          checked={hasAcknowledged}
          onCheckedChange={setHasAcknowledged}
          id="acknowledgement-checkbox"
          label={stringGetter({ key: STRING_KEYS.I_HAVE_READ_AND_AGREE })}
        />
        <Styled.ButtonRow>
          <Button
            action={ButtonAction.Base}
            onClick={() => {
              setIsOpen(false);
            }}
          >
            {stringGetter({ key: STRING_KEYS.CANCEL })}
          </Button>
          <Button
            action={ButtonAction.Primary}
            onClick={() => {
              acceptTerms();
              setIsOpen(false);
            }}
            disabled={!hasAcknowledged}
          >
            {stringGetter({ key: STRING_KEYS.CONTINUE })}
          </Button>
        </Styled.ButtonRow>
      </Styled.Content>
    </Styled.Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Dialog = styled(Dialog)`
  @media ${breakpoints.notMobile} {
    --dialog-width: 30rem;
  }
`;

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;

  p {
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: var(--color-layer-1);
  }
`;

Styled.Link = styled(Link)`
  --link-color: var(--color-accent);
  display: inline-block;
`;

Styled.ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
`;
