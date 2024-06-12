import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import { STRING_KEYS, StringKey } from '@/constants/localization';
import { MenuItem } from '@/constants/menus';
import { EMPTY_ARR } from '@/constants/objects';
import { TradeTypes } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';

import { useAppSelector } from '@/state/appTypes';
import { getInputTradeData, getInputTradeOptions } from '@/state/inputsSelectors';
import { getCurrentMarketAssetId } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { getSelectedTradeType } from '@/lib/tradeData';

export const useTradeTypeOptions = (opts?: { showAssetIcon?: boolean; showAll?: boolean }) => {
  const { showAll, showAssetIcon } = opts ?? {};
  const stringGetter = useStringGetter();

  const currentTradeData = useAppSelector(getInputTradeData, shallowEqual);
  const currentAssetId = useAppSelector(getCurrentMarketAssetId);
  const { type: tradeType } = currentTradeData ?? {};

  const selectedTradeType = getSelectedTradeType(tradeType);

  const { typeOptions } = useAppSelector(getInputTradeOptions, shallowEqual) ?? {};

  const allTradeTypeItems = useMemo((): Array<MenuItem<TradeTypes>> | undefined => {
    const allItems = typeOptions?.toArray()?.map(({ type, stringKey }) => ({
      value: type as TradeTypes,
      label: stringGetter({
        key:
          type === TradeTypes.TAKE_PROFIT
            ? STRING_KEYS.TAKE_PROFIT_LIMIT
            : ((stringKey ?? '') as StringKey),
      }),
      slotBefore: showAssetIcon ? <AssetIcon symbol={currentAssetId} /> : undefined,
    }));
    return allItems;
  }, [currentAssetId, showAssetIcon, stringGetter, typeOptions]);

  const asSubItems = useMemo((): Array<MenuItem<TradeTypes>> => {
    if (allTradeTypeItems == null || allTradeTypeItems.length === 0) {
      return EMPTY_ARR;
    }
    return [
      allTradeTypeItems[0], // Limit order is always first
      allTradeTypeItems[1], // Market order is always second
      // All conditional orders labeled under "Stop Order"
      allTradeTypeItems.length > 2
        ? {
            label: stringGetter({ key: STRING_KEYS.STOP_ORDER_SHORT }),
            value: '' as TradeTypes,
            subitems: allTradeTypeItems.slice(2),
          }
        : undefined,
    ].filter(isTruthy);
  }, [allTradeTypeItems, stringGetter]);

  return {
    selectedTradeType,
    tradeTypeItems: showAll ? allTradeTypeItems ?? EMPTY_ARR : asSubItems,
  };
};
