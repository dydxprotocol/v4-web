import { useEffect, useMemo, useState } from 'react';
import { CollateralAmount, HeadlessDecimalValue, contractId } from 'fuel-ts-sdk';
import { type Asset, PositionSize } from 'fuel-ts-sdk/trading';
import type { FieldErrors } from 'react-hook-form';
import { WalletContext } from '@/contexts/wallet/wallet.context';
import { Card, DashboardHeader } from '@/layouts/dashboard-layout';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useAwaited } from '@/lib/use-awaited';
import { useReloadObserver } from '@/lib/use-reload-observer';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryForm } from '@/modules/order-entry-form';
import type { OrderEntryFormModel } from '@/modules/order-entry-form/src/models';
import { PositionsList } from './components';
import { OrderSubmitFailureModal } from './components/order-submit-failure-modal.component';
import { OrderSubmitSuccessModal } from './components/order-submit-success-modal.component';

export function Home() {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [submittedFormData, setSubmittedFormData] = useState<OrderEntryFormModel | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const tradingSdk = useTradingSdk();
  const wallet = useRequiredContext(WalletContext);

  const userAddress = useAwaited(useMemo(() => wallet.getUserAddress(), [wallet]));
  const userBalances = useAwaited(
    useMemo(() => wallet.getUserBalances(), [wallet]),
    {}
  );

  const assets = useSdkQuery(tradingSdk.getAllAssets);
  const quoteAsset = useSdkQuery(tradingSdk.getWatchedAsset);

  const baseAsset = assets.find((asset) => asset.symbol === 'sUSDC');

  const heldPositions = useSdkQuery(() =>
    userAddress ? tradingSdk.getAccountPositions(userAddress) : null
  );

  const isConnected = wallet.isUserConnected();

  useEffect(() => {
    if (!isConnected) return;
    if (!userAddress) return;
    tradingSdk.fetchPositionsByAccount(userAddress);
  }, [isConnected, tradingSdk, userAddress]);

  useReloadObserver({ isConnected, tradingSdk, userAddress });

  async function handleOrderSubmitSuccess(formData: OrderEntryFormModel) {
    setSubmittedFormData(formData);
    setIsSuccessDialogOpen(true);

    const userWallet = await wallet.getUserWalletReference();
    if (!userWallet || !baseAsset || !quoteAsset) return;

    // Use fixed 10x leverage for testing
    const positionSize = +formData.positionSize;
    const leverage = 10;
    const collateral = positionSize / leverage;

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

  function handleOrderSubmitFailure(errors: FieldErrors<OrderEntryFormModel>) {
    const errorMessages = Object.entries(errors).map(([field, error]) => {
      const fieldName = field
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .trim()
        .replace(/^./, (str) => str.toUpperCase());
      return `${fieldName}: ${error?.message || 'Invalid value'}`;
    });

    setValidationErrors(errorMessages);
    setIsErrorDialogOpen(true);
  }

  function getAssetBalance(asset: Asset | undefined) {
    const assetId = asset?.assetId;
    if (!assetId) return 0;
    if (!(assetId in userBalances)) return 0;
    const bigintBalance = userBalances[assetId];
    return new HeadlessDecimalValue(bigintBalance, BigInt(asset.decimals)).toFloat();
  }

  return (
    <>
      <DashboardHeader title="Starboard" subtitle="Decentralized perpetuals trading on Fuel" />

      <Card>
        <OrderEntryForm
          baseAssetName={baseAsset?.name ?? '?'}
          quoteAssetName={quoteAsset?.name ?? '?'}
          userBalanceInQuoteAsset={getAssetBalance(quoteAsset)}
          userBalanceInBaseAsset={getAssetBalance(baseAsset)}
          currentQuoteAssetPrice={365.32}
          onSubmitSuccessful={handleOrderSubmitSuccess}
          onSubmitFailure={handleOrderSubmitFailure}
        />
      </Card>

      <Card>{heldPositions && <PositionsList positions={heldPositions} />}</Card>

      <OrderSubmitFailureModal
        errors={validationErrors}
        open={isErrorDialogOpen}
        onOpenChange={setIsErrorDialogOpen}
      />

      <OrderSubmitSuccessModal
        formData={submittedFormData}
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
      />
    </>
  );
}

const VAULT_CONTRACT_ID = contractId(
  '0x01bbCEFbC64350a092310d59E29cFF269DB01539866aBb263f6dB78C275a84F2'
);
