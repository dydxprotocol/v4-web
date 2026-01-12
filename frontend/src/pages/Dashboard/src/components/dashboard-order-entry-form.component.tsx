import { type FC, useMemo } from 'react';
import { CollateralAmount, DecimalValue, HeadlessDecimalValue, contractId } from 'fuel-ts-sdk';
import { type Asset } from 'fuel-ts-sdk/trading';
import { WalletContext } from '@/contexts/wallet';
import { useSdkQuery, useSdkQuerySignal, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useAwaited } from '@/lib/use-awaited';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryForm, type OrderEntryFormModel } from '@/modules/order-entry-form';

export const DashboardOrderEntryForm: FC = () => {
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

  function getAssetBalance(asset: Asset | undefined) {
    const assetId = asset?.assetId;
    if (!assetId) return 0;
    if (!userBalances) return 0;
    if (!(assetId in userBalances)) return 0;
    const bigintBalance = userBalances[assetId];
    return new HeadlessDecimalValue(bigintBalance, BigInt(asset.decimals)).toFloat();
  }

  async function handleOrderSubmitSuccess(formData: OrderEntryFormModel) {
    const userWallet = await wallet.getUserWalletReference();
    if (!userWallet || !baseAsset || !quoteAsset) return;

    await tradingSdk.submitOrder({
      collateralAssetId: baseAsset?.assetId,
      indexAsset: quoteAsset.assetId,
      wallet: userWallet,
      vaultContractAddress: VAULT_CONTRACT_ID,
      leverage: DecimalValue.fromDecimalString(formData.leverage),
      collateralAmount: CollateralAmount.fromDecimalString(formData.collateralSize),
      isLong: formData.orderSide === 'long',
    });
  }

  return (
    <OrderEntryForm
      quoteAssetName={quoteAsset?.name ?? '?'}
      userBalanceInBaseAsset={getAssetBalance(baseAsset)}
      currentBaseAssetPrice={baseAssetPriceSignal}
      currentQuoteAssetPrice={quoteAssetPriceSignal}
      minCollateral={10}
      minPositionSize={0.001}
      warnHighLeverage={true}
      onSubmitSuccessful={handleOrderSubmitSuccess}
      onSubmitFailure={console.error}
    />
  );
};

const VAULT_CONTRACT_ID = contractId(
  '0x2D9585c7996af0A382Aff5ba298831cA26b190Bf3eDB37E3FDc1f27AEDefFfc2'
);
