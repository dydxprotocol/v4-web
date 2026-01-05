import { useState } from 'react';
import type { Address } from 'fuel-ts-sdk';
import type { FieldErrors } from 'react-hook-form';
import { Card, DashboardHeader } from '@/layouts/dashboard-layout';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { OrderEntryForm } from '@/modules/order-entry-form';
import type { OrderEntryFormModel } from '@/modules/order-entry-form/src/models';
import { PositionsList, WalletAddressForm } from './components';
import { OrderSubmitFailureModal } from './components/order-submit-failure-modal.component';
import { OrderSubmitSuccessModal } from './components/order-submit-success-modal.component';

export function Home() {
  const [queriedAddress, setQueriedAddress] = useState<Address>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [submittedFormData, setSubmittedFormData] = useState<OrderEntryFormModel | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const tradingSdk = useTradingSdk();
  const heldPositions = useSdkQuery(() =>
    queriedAddress ? tradingSdk.getAccountPositions(queriedAddress) : null
  );

  async function fetchPositionsByAddress(address: Address) {
    await tradingSdk.fetchPositionsByAccount(address);
    setQueriedAddress(address);
  }

  function handleOrderSubmitSuccess(formData: OrderEntryFormModel) {
    setSubmittedFormData(formData);
    setIsSuccessDialogOpen(true);
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

  return (
    <>
      <DashboardHeader title="Starboard" subtitle="Decentralized perpetuals trading on Fuel" />

      <Card>
        <OrderEntryForm
          baseAssetName="BTC"
          quoteAssetName="ZLOTY"
          userBalanceInQuoteAsset={2.137}
          userBalanceInBaseAsset={0.1337}
          currentQuoteAssetPrice={365.32}
          onSubmitSuccessful={handleOrderSubmitSuccess}
          onSubmitFailure={handleOrderSubmitFailure}
        />
      </Card>

      <Card>
        <WalletAddressForm onSubmit={fetchPositionsByAddress} />
        {heldPositions && <PositionsList positions={heldPositions} />}
      </Card>

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
