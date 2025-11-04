import { useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { DoubleArrowUpIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Details } from '@/components/Details';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Tabs } from '@/components/Tabs';
import { FeeTierTable } from '@/views/tables/FeeTierTable';
import { StakingTierTable } from '@/views/tables/StakingTierTable';

import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { truncateAddress } from '@/lib/wallet';

enum TabValues {
  Fees = 'fees',
  Staking = 'staking',
}

export const Fees = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();
  const userStats = useAppSelector(BonsaiCore.account.stats.data);
  const feeTiers = useAppSelector(BonsaiCore.configs.feeTiers);
  const { referredBy } = useSubaccount();
  const { affiliateProgramFaq } = useURLConfigs();
  const [tabValue, setTabValue] = useState<TabValues>(TabValues.Fees);

  const volume = useMemo(() => {
    if (userStats.makerVolume30D !== undefined && userStats.takerVolume30D !== undefined) {
      return userStats.makerVolume30D + userStats.takerVolume30D;
    }
    return null;
  }, [userStats]);

  const userFeeTier = userStats.feeTierId;

  const hasReceivedFeeTierBonus =
    userFeeTier === '3' &&
    referredBy !== undefined &&
    MustBigNumber(volume).lt(feeTiers?.[2]?.volume ?? 0);

  return (
    <AttachedExpandingSection>
      {isNotTablet && <ContentSectionHeader title={stringGetter({ key: STRING_KEYS.FEES })} />}
      <div tw="flexColumn max-w-[100vw] gap-1.5">
        <div tw="flex flex-row">
          <$FeesDetails
            layout="grid"
            hasReceivedFeeTierBonus={hasReceivedFeeTierBonus}
            items={[
              {
                key: 'volume',
                label: (
                  <$CardLabel>
                    <span>{stringGetter({ key: STRING_KEYS.TRAILING_VOLUME })}</span>
                    <span>{stringGetter({ key: STRING_KEYS._30D })}</span>
                  </$CardLabel>
                ),
                value: <Output type={OutputType.Fiat} value={volume} />,
              },
              hasReceivedFeeTierBonus && {
                key: 'bonus',
                label: (
                  <$CardLabel>
                    {stringGetter({
                      key: STRING_KEYS.YOUR_FEE_TIER,
                      params: {
                        TIER: (
                          <span tw="text-color-text-2">
                            {userFeeTier}{' '}
                            <DoubleArrowUpIcon tw="mb-[-1px] inline h-0.75 w-0.75 text-color-positive" />
                          </span>
                        ),
                      },
                    })}
                  </$CardLabel>
                ),
                value: (
                  <span tw="font-mini-book">
                    {stringGetter({
                      key: STRING_KEYS.GIFTED_FEE_TIER_BONUS,
                      params: {
                        AFFILIATE: truncateAddress(referredBy),
                      },
                    })}{' '}
                    <Link
                      tw="inline-flex text-color-accent visited:text-color-accent"
                      href={affiliateProgramFaq}
                    >
                      {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                    </Link>
                  </span>
                ),
              },
            ].filter(isTruthy)}
          />
        </div>

        <Tabs
          tw="gap-1"
          value={tabValue}
          onValueChange={setTabValue}
          dividerStyle="underline"
          withTransitions={false}
          items={[
            {
              value: TabValues.Fees,
              label: stringGetter({ key: STRING_KEYS.FEE_TIERS }),
              content: (
                <$TableContainer>
                  <FeeTierTable />
                </$TableContainer>
              ),
            },
            {
              value: TabValues.Staking,
              label: stringGetter({ key: STRING_KEYS.STAKING_TIERS }),
              content: (
                <$TableContainer>
                  <StakingTierTable />
                </$TableContainer>
              ),
            },
          ]}
        />
      </div>
    </AttachedExpandingSection>
  );
};

const $TableContainer = styled.div`
  ${layoutMixins.contentContainer}
  --content-container-width: var(--withSidebar-current-contentAreaWidth);
  ${layoutMixins.stickyArea3}
  padding: var(--border-width);
`;

const $FeesDetails = styled(Details)<{ hasReceivedFeeTierBonus?: boolean }>`
  gap: 1rem;
  --details-grid-numColumns: ${({ hasReceivedFeeTierBonus }) => (hasReceivedFeeTierBonus ? 2 : 1)};

  @media ${breakpoints.notTablet} {
    margin: 0 1.25rem;
  }

  @media ${breakpoints.tablet} {
    padding: 1rem 1rem 0 1rem;
    --details-grid-numColumns: 1;
  }

  > div {
    max-width: 16rem;
    align-content: normal;

    gap: 1rem;

    padding: 1rem;
    border-radius: 0.625rem;
    background-color: var(--color-layer-3);

    @media ${breakpoints.tablet} {
      max-width: 100%;
    }
  }

  dt {
    width: 100%;
  }

  output {
    font: var(--font-base-book);
  }
`;

const $TextRow = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
`;

const $CardLabel = styled($TextRow)`
  height: 1.5rem;
  font: var(--font-small-book);

  color: var(--color-text-1);

  @media ${breakpoints.tablet} {
    font: var(--font-mini-book);
  }

  > :nth-child(2) {
    color: var(--color-text-0);
  }
`;
