import { useNavigate } from 'react-router-dom';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters } from '@/constants/markets';
import { type MenuConfig } from '@/constants/menus';
import { AppRoute } from '@/constants/routes';

import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const useGlobalCommands = (): MenuConfig<string | number, string | number> => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const { markets } = useMarketsData({
    forceShowUnlaunchedMarkets: true,
    filter: MarketFilters.ALL,
  });

  return [
    {
      group: 'view',
      groupLabel: stringGetter({ key: STRING_KEYS.VIEW }),
      items: [
        {
          value: 'trade',
          slotBefore: <Icon iconName={IconName.Trade} />,
          label: stringGetter({ key: STRING_KEYS.TRADE }),
          onSelect: () => navigate(AppRoute.Trade),
        },
        {
          value: 'portfolio',
          slotBefore: <Icon iconName={IconName.PriceChart} />,
          label: stringGetter({ key: STRING_KEYS.PORTFOLIO }),
          onSelect: () => navigate(AppRoute.Portfolio),
        },
        {
          value: 'markets',
          slotBefore: <Icon iconName={IconName.Markets} />,
          label: stringGetter({ key: STRING_KEYS.MARKETS }),
          onSelect: () => navigate(AppRoute.Markets),
        },
        {
          value: 'token',
          slotBefore: <Icon iconName={IconName.Coins} />,
          label: chainTokenLabel,
          onSelect: () => navigate(`/${chainTokenLabel}`),
        },
        {
          value: 'vaults',
          slotBefore: <Icon iconName={IconName.Governance} />,
          label: stringGetter({ key: STRING_KEYS.MEGAVAULT }),
          onSelect: () => navigate(AppRoute.Vault),
        },
      ],
    },
    {
      group: 'other',
      groupLabel: stringGetter({ key: STRING_KEYS.OTHER }),
      items: [
        {
          value: 'help',
          slotBefore: <Icon iconName={IconName.HelpCircle} />,
          label: stringGetter({ key: STRING_KEYS.HELP }),
          onSelect: () => dispatch(openDialog(DialogTypes.Help())),
        },
        {
          value: 'preferences',
          slotBefore: <Icon iconName={IconName.Gear} />,
          label: stringGetter({ key: STRING_KEYS.PREFERENCES }),
          onSelect: () => dispatch(openDialog(DialogTypes.Preferences())),
        },
        {
          value: 'display',
          slotBefore: <Icon iconName={IconName.Moon} />,
          label: stringGetter({ key: STRING_KEYS.DISPLAY_SETTINGS }),
          onSelect: () => dispatch(openDialog(DialogTypes.DisplaySettings())),
        },
      ],
    },
    {
      group: 'markets',
      groupLabel: stringGetter({ key: STRING_KEYS.MARKETS }),
      items: markets.map(({ name, id, logo, displayableAsset, assetId }) => ({
        value: id,
        slotBefore: <AssetIcon logoUrl={logo} symbol={assetId} />,
        label: name,
        tag: displayableAsset,
        onSelect: () => navigate(`${AppRoute.Trade}/${id}`),
      })),
    },
  ];
};
