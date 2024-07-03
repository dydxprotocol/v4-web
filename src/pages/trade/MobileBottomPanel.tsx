import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { MobileTabs } from '@/components/Tabs';
import { MarketDetails } from '@/views/MarketDetails';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';

enum InfoSection {
  Statistics = 'Statistics',
  About = 'About',
  Vault = 'Vault',
}

export const MobileBottomPanel = () => {
  const stringGetter = useStringGetter();

  return (
    <MobileTabs
      defaultValue={InfoSection.Statistics}
      items={[
        {
          value: InfoSection.Statistics,
          label: stringGetter({ key: STRING_KEYS.STATISTICS }),
          content: <MarketStatsDetails showMidMarketPrice={false} />,
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
