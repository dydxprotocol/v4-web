import { useMemo } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { MobileTabs } from '@/components/Tabs';
import { LaunchableMarketStatsDetails } from '@/views/LaunchableMarketStatsDetails';
import { CurrentMarketDetails } from '@/views/MarketDetails/CurrentMarketDetails';
import { LaunchableMarketDetails } from '@/views/MarketDetails/LaunchableMarketDetails';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';

enum InfoSection {
  Statistics = 'Statistics',
  About = 'About',
  Vault = 'Vault',
}

export const MobileBottomPanel = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const stringGetter = useStringGetter();

  const items = useMemo(() => {
    if (launchableMarketId) {
      return [
        {
          value: InfoSection.Statistics,
          label: stringGetter({ key: STRING_KEYS.STATISTICS }),
          content: (
            <LaunchableMarketStatsDetails
              launchableMarketId={launchableMarketId}
              showMidMarketPrice={false}
            />
          ),
        },
        {
          value: InfoSection.About,
          label: stringGetter({ key: STRING_KEYS.ABOUT }),
          content: <LaunchableMarketDetails launchableMarketId={launchableMarketId} />,
        },
      ];
    }

    return [
      {
        value: InfoSection.Statistics,
        label: stringGetter({ key: STRING_KEYS.STATISTICS }),
        content: <MarketStatsDetails showMidMarketPrice={false} />,
      },
      {
        value: InfoSection.About,
        label: stringGetter({ key: STRING_KEYS.ABOUT }),
        content: <CurrentMarketDetails />,
      },
    ];
  }, [launchableMarketId, stringGetter]);

  return <MobileTabs defaultValue={InfoSection.Statistics} items={items} />;
};
