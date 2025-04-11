import { useMemo } from 'react';

import { TradeFormType } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';

import { STRING_KEYS } from '@/constants/localization';
import { MenuItem } from '@/constants/menus';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';

import { useAppSelector } from '@/state/appTypes';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

import { isTruthy } from '@/lib/isTruthy';

export const useTradeTypeOptions = (opts?: { showAssetIcon?: boolean; showAll?: boolean }) => {
  const { showAll, showAssetIcon } = opts ?? {};
  const stringGetter = useStringGetter();

  const currentTradeData = useAppSelector(getTradeFormValues);
  const currentAssetId = useAppSelector(BonsaiHelpers.currentMarket.assetId);
  const imageUrl = useAppSelector(BonsaiHelpers.currentMarket.assetLogo);

  const { type: selectedTradeType } = currentTradeData;

  const typeOptions = useAppSelector(getTradeFormSummary).summary.options.orderTypeOptions;

  const allTradeTypeItems = useMemo((): Array<MenuItem<TradeFormType>> | undefined => {
    const allItems = typeOptions.map(({ value, stringKey }) => ({
      value,
      label: stringGetter({
        key: stringKey,
      }),
      slotBefore: showAssetIcon ? (
        <AssetIcon logoUrl={imageUrl} symbol={currentAssetId} />
      ) : undefined,
    }));
    return allItems;
  }, [currentAssetId, imageUrl, showAssetIcon, stringGetter, typeOptions]);

  const asSubItems = useMemo((): Array<MenuItem<TradeFormType>> => {
    if (allTradeTypeItems == null || allTradeTypeItems.length === 0) {
      return EMPTY_ARR;
    }
    return [
      allTradeTypeItems[0], // Limit order is always first
      allTradeTypeItems[1], // Market order is always second
      // All conditional orders labeled under "Stop Order"
      allTradeTypeItems.length > 2
        ? {
            label:
              selectedTradeType === TradeFormType.TAKE_PROFIT_LIMIT ||
              selectedTradeType === TradeFormType.TAKE_PROFIT_MARKET
                ? stringGetter({ key: STRING_KEYS.TAKE_PROFIT })
                : selectedTradeType === TradeFormType.STOP_LIMIT ||
                    selectedTradeType === TradeFormType.STOP_MARKET
                  ? stringGetter({ key: STRING_KEYS.STOP_ORDER_SHORT })
                  : stringGetter({ key: STRING_KEYS.ADVANCED }),
            value: '' as TradeFormType,
            subitems: allTradeTypeItems.slice(2),
          }
        : undefined,
    ].filter(isTruthy);
  }, [allTradeTypeItems, selectedTradeType, stringGetter]);

  return {
    selectedTradeType,
    tradeTypeItems: showAll ? allTradeTypeItems ?? EMPTY_ARR : asSubItems,
  };
};
