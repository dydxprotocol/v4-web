import { type FC, type ReactNode, useCallback, useMemo } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import type { AssetEntity } from 'fuel-ts-sdk/trading';
import { useSdkQuery, useSdkQuerySignal, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { OrderEntryFormMetaContext } from '@/modules/OrderEntryForm';

type DashboardOrderFormMetaProviderProps = {
  children: ReactNode;
};

export const DashboardOrderFormMetaProvider: FC<DashboardOrderFormMetaProviderProps> = ({
  children,
}) => {
  const tradingSdk = useTradingSdk();
  const allAssets = useSdkQuery(tradingSdk.getAllAssets);
  const userBalances = useSdkQuery((sdk) => sdk.accounts.getCurrentUserBalances());

  const baseAsset = allAssets.find((asset) => asset.symbol === 'USDC');
  const quoteAsset = useSdkQuery(tradingSdk.getWatchedAsset);

  const quoteAssetPriceSignal = useSdkQuerySignal(() => {
    const watchedAssetPrice = tradingSdk.getWatchedAssetLatestPrice();
    if (!watchedAssetPrice) return 1;
    return $decimalValue(watchedAssetPrice.value).toFloat();
  });
  const baseAssetPriceSignal = useSdkQuerySignal(() => {
    const baseAssetPrice = tradingSdk.getBaseAssetLatestPrice();
    if (!baseAssetPrice) return 1;
    return $decimalValue(baseAssetPrice.value).toFloat() ?? 1;
  });

  const getAssetBalance = useCallback(
    (asset: AssetEntity | undefined) => {
      const assetId = asset?.assetId;
      if (!assetId) return 0;
      if (!userBalances) return 0;
      if (!(assetId in userBalances)) return 0;
      return $decimalValue(userBalances[assetId]!).toFloat();
    },
    [userBalances]
  );

  const metaContextValue = useMemo(
    () => ({
      quoteAssetName: quoteAsset?.name ?? '?',
      userBalanceInBaseAsset: getAssetBalance(baseAsset),
      currentBaseAssetPrice: baseAssetPriceSignal,
      currentQuoteAssetPrice: quoteAssetPriceSignal,
      minCollateral: 10,
      minPositionSize: 0.001,
      warnHighLeverage: true,
    }),
    [baseAsset, baseAssetPriceSignal, getAssetBalance, quoteAsset?.name, quoteAssetPriceSignal]
  );

  return (
    <OrderEntryFormMetaContext.Provider value={metaContextValue}>
      {children}
    </OrderEntryFormMetaContext.Provider>
  );
};
