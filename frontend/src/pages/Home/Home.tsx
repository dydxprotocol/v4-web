import { useState } from 'react';
import type { Address } from 'fuel-ts-sdk';
import { Card, DashboardHeader } from '@/layouts/dashboard-layout';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { PositionsList, WalletAddressForm } from './components';

export function Home() {
  const [queriedAddress, setQueriedAddress] = useState<Address>();
  const tradingSdk = useTradingSdk();
  const heldPositions = useSdkQuery(() =>
    queriedAddress ? tradingSdk.getAccountPositions(queriedAddress) : []
  );

  async function fetchPositionsByAddress(address: Address) {
    await tradingSdk.fetchPositionsByAccount(address);
    setQueriedAddress(address);
  }

  return (
    <>
      <DashboardHeader title="Starboard" subtitle="Decentralized perpetuals trading on Fuel" />

      <Card>
        <WalletAddressForm onSubmit={fetchPositionsByAddress} />
        <PositionsList positions={heldPositions} />
      </Card>
    </>
  );
}
