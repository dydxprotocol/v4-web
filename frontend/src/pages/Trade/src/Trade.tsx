import { useState } from 'react';
import type { AssetId } from 'fuel-ts-sdk';
import { Card, DashboardHeader } from '@/layouts/dashboard-layout';
import * as styles from './Trade.css';
import { AssetChart } from './components/asset-chart.component';
import { AssetSelectorForm } from './components/asset-selector-form.component';

const DEFAULT_ASSET = '0xa3ed2e58076f53e8dd15c8463ee49e6ce547355c34c639777c5dace3728e2ded';

export function Trade() {
  const [currentAsset, setCurrentAsset] = useState<AssetId | null>(null);

  return (
    <>
      <DashboardHeader
        title="Trading Dashboard"
        subtitle="Real-time perpetuals trading and analytics"
      />

      <Card>
        <AssetSelectorForm onSubmit={setCurrentAsset} defaultValue={DEFAULT_ASSET} />
      </Card>

      {currentAsset && (
        <div css={styles.chartContainer}>
          <AssetChart assetId={currentAsset} />
        </div>
      )}
    </>
  );
}
