import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Asset, PerpetualMarket } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { type MenuConfig } from '@/constants/menus';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { openDialog } from '@/state/dialogs';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { safeAssign } from '@/lib/objectHelpers';
import { testFlags } from '@/lib/testFlags';
import { orEmptyRecord } from '@/lib/typeUtils';

export const useGlobalCommands = (): MenuConfig<string | number, string | number> => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const showVaults = testFlags.enableVaults;

  const allPerpetualMarkets = orEmptyRecord(useAppSelector(getPerpetualMarkets, shallowEqual));
  const allAssets = orEmptyRecord(useAppSelector(getAssets, shallowEqual));

  const joinedPerpetualMarketsAndAssets = Object.values(allPerpetualMarkets).map(
    (market): PerpetualMarket & Asset => safeAssign({}, market, allAssets[market?.assetId] ?? {})
  );

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
        showVaults && {
          value: 'vaults',
          slotBefore: <Icon iconName={IconName.Governance} />,
          label: stringGetter({ key: STRING_KEYS.VAULT }),
          onSelect: () => navigate(AppRoute.Vault),
        },
      ].filter(isTruthy),
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
    // {
    //   group: 'trading',
    //   groupLabel: 'Trading',
    //   items: [
    //     {
    //       value: TradeItems.PlaceMarketOrder,
    //       label: 'Place Market Order',
    //       onSelect: () => {},
    //     },
    //     {
    //       value: TradeItems.PlaceLimitOrder,
    //       label: 'Place Limit Order',
    //       onSelect: () => {},
    //     },
    //     {
    //       value: TradeItems.PlaceStopLimitOrder,
    //       label: 'Place Stop Limit Order',
    //       onSelect: () => {},
    //     },
    //   ],
    // },
    {
      group: 'markets',
      groupLabel: stringGetter({ key: STRING_KEYS.MARKETS }),
      items: joinedPerpetualMarketsAndAssets.map(({ market, name, id }) => ({
        value: market ?? '',
        slotBefore: <AssetIcon symbol={id} />,
        label: name ?? '',
        tag: id,
        onSelect: () => navigate(`${AppRoute.Trade}/${market}`),
      })),
    },
  ];
};
