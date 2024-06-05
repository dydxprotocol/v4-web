import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Asset, PerpetualMarket } from '@/constants/abacus';
import { TradeLayouts } from '@/constants/layout';
import { type MenuConfig } from '@/constants/menus';
import { AppRoute } from '@/constants/routes';

import { AssetIcon } from '@/components/AssetIcon';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import {
  AppColorMode,
  AppTheme,
  AppThemeSystemSetting,
  setAppColorMode,
  setAppThemeSetting,
} from '@/state/configs';
import { setSelectedTradeLayout } from '@/state/layout';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

enum LayoutItems {
  setDefaultLayout = 'SetDefaultLayout',
  setReverseLayout = 'SetReverseLayout',
  setAlternativeLayout = 'SetAlternativeLayout',
}

enum NavItems {
  NavigateToMarket = 'NavigateToMarket',
}

export const useGlobalCommands = (): MenuConfig<string, string> => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const allPerpetualMarkets = orEmptyObj(useAppSelector(getPerpetualMarkets, shallowEqual));
  const allAssets = orEmptyObj(useAppSelector(getAssets, shallowEqual));

  const joinedPerpetualMarketsAndAssets = Object.values(allPerpetualMarkets).map(
    (market): PerpetualMarket & Asset => Object.assign({}, market, allAssets[market?.assetId] ?? {})
  );

  return [
    {
      group: 'themes',
      groupLabel: 'Themes',
      items: [
        {
          value: AppTheme.Classic,
          label: 'Set Classic Theme',
          onSelect: () => {
            dispatch(setAppThemeSetting(AppTheme.Classic));
          },
        },
        {
          value: AppThemeSystemSetting.System,
          label: 'Set System Theme',
          onSelect: () => {
            dispatch(setAppThemeSetting(AppThemeSystemSetting.System));
          },
        },
        {
          value: AppTheme.Light,
          label: 'Set Light Theme',
          onSelect: () => {
            dispatch(setAppThemeSetting(AppTheme.Light));
          },
        },
        {
          value: AppTheme.Dark,
          label: 'Set Dark Theme',
          onSelect: () => {
            dispatch(setAppThemeSetting(AppTheme.Dark));
          },
        },
      ],
    },
    {
      group: 'colorPreferences',
      groupLabel: 'Color Preferences',
      items: [
        {
          value: AppColorMode.GreenUp,
          label: 'Set Green is Up',
          onSelect: () => {
            dispatch(setAppColorMode(AppColorMode.GreenUp));
          },
        },
        {
          value: AppColorMode.RedUp,
          label: 'Set Red is Up',
          onSelect: () => {
            dispatch(setAppColorMode(AppColorMode.RedUp));
          },
        },
      ],
    },
    {
      group: 'layout',
      groupLabel: 'Layout',
      items: [
        {
          value: LayoutItems.setDefaultLayout,
          label: 'Set Default Layout',
          onSelect: () => {
            dispatch(setSelectedTradeLayout(TradeLayouts.Default));
          },
        },
        {
          value: LayoutItems.setReverseLayout,
          label: 'Set Reverse Layout',
          onSelect: () => {
            dispatch(setSelectedTradeLayout(TradeLayouts.Reverse));
          },
        },
        {
          value: LayoutItems.setAlternativeLayout,
          label: 'Set Alternative Layout',
          onSelect: () => {
            dispatch(setSelectedTradeLayout(TradeLayouts.Alternative));
          },
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
      group: 'navigation',
      groupLabel: 'Navigation',
      items: [
        {
          value: NavItems.NavigateToMarket,
          label: 'Navigate to Market',
          subitems: joinedPerpetualMarketsAndAssets.map(({ market, name, id }) => ({
            value: market ?? '',
            slotBefore: <AssetIcon symbol={id} />,
            label: name ?? '',
            tag: id,
            onSelect: () => navigate(`${AppRoute.Trade}/${market}`),
          })),
        },
      ],
    },
  ];
};
