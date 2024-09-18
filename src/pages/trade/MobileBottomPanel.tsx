import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { MobileTabs } from '@/components/Tabs';
import { MarketDetails } from '@/views/MarketDetails';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { UnlaunchedMarketStatsDetails } from '@/views/UnlaunchedMarketStatsDetails';

enum InfoSection {
  Statistics = 'Statistics',
  About = 'About',
  Vault = 'Vault',
}

export const MobileBottomPanel = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const stringGetter = useStringGetter();

  return (
    <MobileTabs
      defaultValue={InfoSection.Statistics}
      items={[
        {
          value: InfoSection.Statistics,
          label: stringGetter({ key: STRING_KEYS.STATISTICS }),
          content: launchableMarketId ? (
            <UnlaunchedMarketStatsDetails
              launchableMarketId={launchableMarketId}
              showMidMarketPrice={false}
            />
          ) : (
            <MarketStatsDetails showMidMarketPrice={false} />
          ),
        },
        {
          value: InfoSection.About,
          label: stringGetter({ key: STRING_KEYS.ABOUT }),
          content: <MarketDetails />,
        },
      ]}
      withBorders={false}
    />
  );
};
