import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { layoutMixins } from '@/styles/layoutMixins';
import { useStringGetter } from '@/hooks';

import { Accordion } from '@/components/Accordion';
import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';

const REWARDS_LEARN_MORE_LINK = ''; // to be configured

export const RewardsHelpPanel = () => {
  const stringGetter = useStringGetter();

  return (
    <Styled.HelpCard
      slotHeader={
        <Styled.Header>
          <h3>{stringGetter({ key: STRING_KEYS.HELP })}</h3>
          {REWARDS_LEARN_MORE_LINK && (
            <Link withIcon href={REWARDS_LEARN_MORE_LINK}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
            </Link>
          )}
        </Styled.Header>
      }
    >
      <Accordion
        items={[
          {
            header: 'Who is eligible for trading rewards?',
            content: 'All traders are eligible for trading rewards.',
          },
          {
            header: 'How do trading rewards work?',
            content:
              'Immediately after each fill, trading rewards are sent directly to the trader’s dYdX Chain address, based on the amount of fees paid by the trader.',
          },
          {
            header: 'How do I claim my rewards?',
            content:
              'Each block, trading rewards are automatically sent directly to the trader’s dYdX Chain address.',
          },
        ]}
      />
    </Styled.HelpCard>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.HelpCard = styled(Panel)`
  --panel-content-paddingY: 0;
  width: 100%;
  height: max-content;
  padding: 0;
  gap: 0;

  text-align: start;
`;

Styled.Header = styled.div`
  ${layoutMixins.spacedRow}
  gap: 1ch;

  padding: 1.25rem 1.5rem;
  border-bottom: var(--border-width) solid var(--border-color);

  font: var(--font-small-book);

  h3 {
    font: var(--font-medium-book);
    color: var(--color-text-2);
  }
`;

Styled.Link = styled(Link)`
  display: inline-flex;
`;
