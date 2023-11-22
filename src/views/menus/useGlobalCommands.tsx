import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { type MenuConfig } from '@/constants/menus';
import { TradeLayouts } from '@/constants/layout';

import { AssetIcon } from '@/components/AssetIcon';

import { AppTheme, setAppTheme } from '@/state/configs';
import { setSelectedTradeLayout } from '@/state/layout';

import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

enum ThemeItems {
  SetClassicTheme = 'SetDefaultTheme',
  SetLightTheme = 'SetLightTheme',
  SetDarkTheme = 'SetDarkTheme',
}

enum LayoutItems {
  setDefaultLayout = 'SetDefaultLayout',
  setReverseLayout = 'SetReverseLayout',
  setAlternativeLayout = 'SetAlternativeLayout',
}

enum TradeItems {
  PlaceMarketOrder = 'PlaceMarketOrder',
  PlaceLimitOrder = 'PlaceLimitOrder',
  PlaceStopLimitOrder = 'PlaceStopLimitOrder',
}

enum NavItems {
  NavigateToMarket = 'NavigateToMarket',
}

export const useGlobalCommands = (): MenuConfig<string, string> => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const allPerpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const allAssets = useSelector(getAssets, shallowEqual) || {};

  const joinedPerpetualMarketsAndAssets = Object.values(allPerpetualMarkets).map((market) => ({
    ...market,
    ...allAssets[market?.assetId],
  }));

  return [
    {
      group: 'themes',
      groupLabel: 'Themes',
      items: [
        {
          value: ThemeItems.SetClassicTheme,
          label: 'Set Classic Theme',
          onSelect: () => {
            dispatch(setAppTheme(AppTheme.Classic));
          },
        },
        {
          value: ThemeItems.SetLightTheme,
          label: 'Set Light Theme',
          onSelect: () => {
            dispatch(setAppTheme(AppTheme.Light));
          },
        },
        {
          value: ThemeItems.SetDarkTheme,
          label: 'Set Dark Theme',
          onSelect: () => {
            dispatch(setAppTheme(AppTheme.Dark));
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
          subitems: joinedPerpetualMarketsAndAssets.map(({ market = '', name = '', id = '' }) => ({
            value: market,
            slotBefore: <AssetIcon symbol={id} />,
            label: name,
            tag: id,
            onSelect: () => navigate(`/trade/${market}`),
          })),
        },
      ],
    },
  ];
};
