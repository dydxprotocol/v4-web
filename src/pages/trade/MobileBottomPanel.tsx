import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { MobileTabs } from '@/components/Tabs';
import { MarketDetails } from '@/views/MarketDetails';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { VaultDetails } from '@/views/VaultDetails';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketHasVault } from '@/state/vaultSelectors';

import { testFlags } from '@/lib/testFlags';
import { isPresent } from '@/lib/typeUtils';

enum InfoSection {
  Statistics = 'Statistics',
  About = 'About',
  Vault = 'Vault',
}

export const MobileBottomPanel = () => {
  const stringGetter = useStringGetter();

  const hasVault = useAppSelector(getCurrentMarketHasVault);
  const showVaults = testFlags.enableVaults;

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
        hasVault && showVaults
          ? {
              value: InfoSection.Vault,
              label: 'LP Vault',
              content: <VaultDetails />,
            }
          : undefined,
      ].filter(isPresent)}
      withBorders={false}
    />
  );
};
