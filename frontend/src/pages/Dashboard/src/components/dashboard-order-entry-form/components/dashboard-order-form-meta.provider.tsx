import { type FC, type ReactNode, useCallback, useMemo } from 'react';
import { HeadlessDecimalValue } from 'fuel-ts-sdk';
import type { Asset } from 'fuel-ts-sdk/trading';
import { WalletContext } from '@/contexts/wallet';
import { useSdkQuery, useSdkQuerySignal, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useAwaited } from '@/lib/use-awaited';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormMetaContext } from '@/modules/order-entry-form';

type DashboardOrderFormMetaProviderProps = {
  children: ReactNode;
};

export const DashboardOrderFormMetaProvider: FC<DashboardOrderFormMetaProviderProps> = ({
  children,
}) => {
  const tradingSdk = useTradingSdk();
  const wallet = useRequiredContext(WalletContext);
  const allAssets = useSdkQuery(tradingSdk.getAllAssets);
  const userBalances = useAwaited(useMemo(() => wallet.getUserBalances(), [wallet]));

  const baseAsset = allAssets.find((asset) => asset.symbol === 'USDC');
  const quoteAsset = useSdkQuery(tradingSdk.getWatchedAsset);

  const quoteAssetPriceSignal = useSdkQuerySignal(
    () => tradingSdk.getWatchedAssetLatestPrice()?.value.toFloat() ?? 1
  );
  const baseAssetPriceSignal = useSdkQuerySignal(
    () => tradingSdk.getBaseAssetLatestPrice()?.value.toFloat() ?? 1
  );

  const getAssetBalance = useCallback(
    (asset: Asset | undefined) => {
      const assetId = asset?.assetId;
      if (!assetId) return 0;
      if (!userBalances) return 0;
      if (!(assetId in userBalances)) return 0;
      const bigintBalance = userBalances[assetId];
      return new HeadlessDecimalValue(bigintBalance, BigInt(asset.decimals)).toFloat();
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
