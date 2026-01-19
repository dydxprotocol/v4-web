import { type FC, useCallback, useState } from 'react';
import { Button } from '@radix-ui/themes';
import { CollateralAmount, DecimalValue } from 'fuel-ts-sdk';
import { WalletContext } from '@/contexts/WalletContext';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import {
  LeverageInput,
  OrderEntryFormApiContextProvider,
  type OrderEntryFormModel,
  OrderSideSwitch,
  PositionSizeInputs,
} from '@/modules/OrderEntryForm';
import * as styles from './DashboardOrderEntryForm.css';
import { DashboardOrderFormMetaProvider } from './components/DashboardOrderFormMetaProvider';
import {
  ProcessingTransactionDialog,
  TransactionErrorDialog,
  TransactionSuccessDialog,
  ValidationErrorDialog,
} from './components/OrderFormDialog';
import { SubmitPositionButton } from './components/SubmitPositionButton';

type TransactionState = 'idle' | 'pending' | 'success' | 'error';

export const DashboardOrderEntryForm: FC = () => {
  const tradingSdk = useTradingSdk();
  const wallet = useRequiredContext(WalletContext);

  const [transactionState, setTransactionState] = useState<TransactionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showValidationError, setShowValidationError] = useState(false);

  const isWalletConnected = wallet.isUserConnected();

  const baseAsset = useSdkQuery(tradingSdk.getBaseAsset);
  const quoteAsset = useSdkQuery(tradingSdk.getWatchedAsset);

  const processOrder = useCallback(
    async (formData: OrderEntryFormModel) => {
      const userWallet = await wallet.getUserWalletReference();
      if (!userWallet || !baseAsset || !quoteAsset)
        throw new Error(
          `Form is not ready for submission. All variables must be defined: userWallet (${userWallet}), baseAsset (${baseAsset}), quoteAsset (${quoteAsset})`
        );

      await tradingSdk.submitOrder({
        collateralAssetId: baseAsset?.assetId,
        indexAsset: quoteAsset.assetId,
        wallet: userWallet,
        leverage: DecimalValue.fromDecimalString(formData.leverage),
        collateralAmount: CollateralAmount.fromDecimalString(formData.collateralSize),
        isLong: formData.orderSide === 'long',
      });
    },
    [wallet, baseAsset, quoteAsset, tradingSdk]
  );

  const handleOrderSubmission = useCallback(
    async (formData: OrderEntryFormModel) => {
      setTransactionState('pending');
      setErrorMessage('');

      try {
        await processOrder(formData);
        setTransactionState('success');
      } catch (err) {
        setTransactionState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Transaction failed');
      }
    },
    [processOrder]
  );

  const handleValidationError = useCallback(() => {
    setShowValidationError(true);
  }, []);

  return (
    <div css={styles.container}>
      <DashboardOrderFormMetaProvider>
        <OrderEntryFormApiContextProvider
          onSubmitSuccessful={handleOrderSubmission}
          onSubmitFailure={handleValidationError}
          skipValidation={!isWalletConnected}
        >
          <OrderSideSwitch />
          <PositionSizeInputs />
          <LeverageInput />
          {isWalletConnected ? (
            <SubmitPositionButton />
          ) : (
            <Button size="3" onClick={wallet.establishConnection} css={styles.connectWalletButton}>
              Connect Wallet
            </Button>
          )}
        </OrderEntryFormApiContextProvider>
      </DashboardOrderFormMetaProvider>

      <ValidationErrorDialog
        open={showValidationError}
        onOpenChange={(open) => !open && setShowValidationError(false)}
      />

      <ProcessingTransactionDialog open={transactionState === 'pending'} />

      <TransactionSuccessDialog
        open={transactionState === 'success'}
        onOpenChange={(open) => !open && setTransactionState('idle')}
      />

      <TransactionErrorDialog
        open={transactionState === 'error'}
        onOpenChange={(open) => !open && setTransactionState('idle')}
        description={
          errorMessage || 'An error occurred while submitting your transaction. Please try again.'
        }
      />
    </div>
  );
};
