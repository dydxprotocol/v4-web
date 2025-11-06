import { useState } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Tabs } from '@/components/Tabs';
import { FeeTierTable } from '@/views/tables/FeeTierTable';
import { StakingTierTable } from '@/views/tables/StakingTierTable';

import { FeePageHeader } from './FeePageHeader';

enum TabValues {
  Fees = 'fees',
  Staking = 'staking',
}

export const Fees = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();
  const [tabValue, setTabValue] = useState<TabValues>(TabValues.Fees);

  return (
    <AttachedExpandingSection>
      {isNotTablet && <ContentSectionHeader title={stringGetter({ key: STRING_KEYS.FEES })} />}
      <div tw="flexColumn max-w-[100vw] gap-1.5">
        <FeePageHeader />

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
