import { type FC, useMemo } from 'react';
import { CollateralAmount, HeadlessDecimalValue, contractId } from 'fuel-ts-sdk';
import { type Asset, PositionSize } from 'fuel-ts-sdk/trading';
import { WalletContext } from '@/contexts/wallet';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useAwaited } from '@/lib/use-awaited';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryForm, type OrderEntryFormModel } from '@/modules/order-entry-form';

export const DashboardOrderEntryForm: FC = () => {
  const tradingSdk = useTradingSdk();
  const wallet = useRequiredContext(WalletContext);
  const allAssets = useSdkQuery(tradingSdk.getAllAssets);
  const userBalances = useAwaited(useMemo(() => wallet.getUserBalances(), [wallet]));

  const baseAsset = allAssets.find((asset) => asset.symbol === 'sUSDC');
  const quoteAsset = useSdkQuery(tradingSdk.getWatchedAsset);

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

    const positionSize = +formData.positionSize;
    const collateral = positionSize / TEMP_FIXED_LEVERAGE;

    await tradingSdk.submitOrder({
      collateralAssetId: baseAsset?.assetId,
      indexAsset: quoteAsset.assetId,
      wallet: userWallet,
      vaultContractAddress: VAULT_CONTRACT_ID,
      sizeDelta: PositionSize.fromFloat(positionSize),
      collateralAmount: CollateralAmount.fromFloat(collateral),
      isLong: formData.orderSide === 'buy',
    });
  }

  return (
    <OrderEntryForm
      baseAssetName={baseAsset?.name ?? '?'}
      quoteAssetName={quoteAsset?.name ?? '?'}
      userBalanceInBaseAsset={getAssetBalance(baseAsset)}
      userBalanceInQuoteAsset={getAssetBalance(quoteAsset)}
      currentQuoteAssetPrice={365.32}
      onSubmitSuccessful={handleOrderSubmitSuccess}
      onSubmitFailure={console.error}
    />
  );
};

const TEMP_FIXED_LEVERAGE = 10;
const VAULT_CONTRACT_ID = contractId(
  '0x01bbCEFbC64350a092310d59E29cFF269DB01539866aBb263f6dB78C275a84F2'
);
