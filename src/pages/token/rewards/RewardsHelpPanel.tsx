import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Accordion } from '@/components/Accordion';
import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';

const REWARDS_LEARN_MORE_LINK = 'https://docs.dydx.exchange/rewards/trading_rewards';

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
            header: stringGetter({ key: STRING_KEYS.FAQ_WHO_IS_ELIGIBLE_QUESTION }),
            content: stringGetter({ key: STRING_KEYS.FAQ_WHO_IS_ELIGIBLE_ANSWER }),
          },
          {
            header: stringGetter({ key: STRING_KEYS.FAQ_HOW_DO_TRADING_REWARDS_WORK_QUESTION }),
            content: stringGetter({ key: STRING_KEYS.FAQ_HOW_DO_TRADING_REWARDS_WORK_ANSWER }),
          },
          {
            header: stringGetter({ key: STRING_KEYS.FAQ_HOW_DO_I_CLAIM_MY_REWARDS_QUESTION }),
            content: stringGetter({ key: STRING_KEYS.FAQ_HOW_DO_I_CLAIM_MY_REWARDS_ANSWER }),
          },
        ]}
      />
    </Styled.HelpCard>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.HelpCard = styled(Panel)`
  --panel-content-paddingX: 0;
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

  padding: 1rem 1rem;
  border-bottom: var(--border-width) solid var(--border-color);

  font: var(--font-small-book);

  @media ${breakpoints.notTablet} {
    padding: 1.5rem;
  }

  h3 {
    font: var(--font-medium-book);
    color: var(--color-text-2);
  }
`;

Styled.Link = styled(Link)`
  display: inline-flex;
`;
