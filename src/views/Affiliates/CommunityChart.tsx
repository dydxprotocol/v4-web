import { useState } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

enum Tab {
  ReferredVolume = 'referred_volume',
  AffiliatePayouts = 'affiliate_payouts',
  ReferredUsers = 'referred_users',
  ReferredTrades = 'referred_trades',
}

export const CommunityChart = () => {
  const [currTab, setCurrTab] = useState(Tab.ReferredVolume);
  const stringGetter = useStringGetter();

  return (
    <div className="notTablet:px-1">
      <Tabs
        value={currTab}
        onValueChange={setCurrTab}
        items={[
          { value: Tab.ReferredVolume, label: stringGetter({ key: STRING_KEYS.VOLUME_REFERRED }) },
          {
            value: Tab.AffiliatePayouts,
            label: stringGetter({ key: STRING_KEYS.AFFILIATE_PAYOUTS }),
          },
          { value: Tab.ReferredUsers, label: stringGetter({ key: STRING_KEYS.USERS_REFERRED }) },
          { value: Tab.ReferredTrades, label: stringGetter({ key: STRING_KEYS.TRADES_REFERRED }) },
        ]}
      />

      <$ChartContainer className="bg-color-layer-3 p-4">Community Chart</$ChartContainer>
    </div>
  );
};

const $ChartContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
`;
