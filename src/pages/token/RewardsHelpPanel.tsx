import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Accordion } from '@/components/Accordion';
import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';

export const RewardsHelpPanel = () => {
  const stringGetter = useStringGetter();

  const { protocolStaking, tradingRewardsLearnMore, stakingAndClaimingRewardsLearnMore } =
    useURLConfigs();

  const hereLink = (href?: string) => (
    <Link isAccent isInline href={href}>
      {stringGetter({ key: STRING_KEYS.HERE })}
    </Link>
  );

  return (
    <$HelpCard
      slotHeader={
        <$Header>
          <h3>{stringGetter({ key: STRING_KEYS.HELP })}</h3>
          {tradingRewardsLearnMore && (
            <Link withIcon href={tradingRewardsLearnMore}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
            </Link>
          )}
        </$Header>
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
            content: stringGetter({
              key: STRING_KEYS.FAQ_HOW_DO_TRADING_REWARDS_WORK_ANSWER,
              params: {
                HERE_LINK: hereLink(tradingRewardsLearnMore),
              },
            }),
          },
          {
            header: stringGetter({ key: STRING_KEYS.FAQ_HOW_DO_I_CLAIM_MY_REWARDS_QUESTION }),
            content: stringGetter({ key: STRING_KEYS.FAQ_HOW_DO_I_CLAIM_MY_REWARDS_ANSWER }),
          },
          {
            header: stringGetter({ key: STRING_KEYS.FAQ_WHAT_IS_STAKING_QUESTION }),
            content: stringGetter({
              key: STRING_KEYS.FAQ_WHAT_IS_STAKING_ANSWER,
              params: {
                HERE_LINK: hereLink(protocolStaking),
              },
            }),
          },
          {
            header: stringGetter({
              key: STRING_KEYS.FAQ_HOW_DO_I_STAKE_AND_CLAIM_REWARDS_QUESTION,
            }),
            content: stringGetter({
              key: STRING_KEYS.FAQ_HOW_DO_I_STAKE_AND_CLAIM_REWARDS_ANSWER,
              params: {
                HERE_LINK: hereLink(stakingAndClaimingRewardsLearnMore),
              },
            }),
          },
          {
            header: stringGetter({
              key: STRING_KEYS.FAQ_WHAT_ARE_THE_RISKS_OF_STAKING_QUESTION,
            }),
            content: stringGetter({
              key: STRING_KEYS.FAQ_WHAT_ARE_THE_RISKS_OF_STAKING_ANSWER,
            }),
          },
        ]}
      />
    </$HelpCard>
  );
};

const $HelpCard = styled(Panel)`
  --panel-content-paddingX: 0;
  --panel-content-paddingY: 0;
  width: 100%;
  height: max-content;
  padding: 0;
  gap: 0;

  text-align: start;
`;

const $Header = styled.div`
  ${layoutMixins.spacedRow}
  gap: 1ch;

  padding: 1rem 1rem;
  border-bottom: var(--border-width) solid var(--border-color);

  font: var(--font-base-book);

  @media ${breakpoints.notTablet} {
    padding: 1.5rem;
  }

  h3 {
    font: var(--font-medium-book);
    color: var(--color-text-2);
  }
`;
