import { DashboardHeader } from '@/layouts/dashboard-layout';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import * as styles from './Trade.css';
import { AssetChart } from './components/asset-chart.component';

export function Trade() {
  const tradingSdk = useTradingSdk();
  const currentAsset = useSdkQuery(tradingSdk.getWatchedAsset);

  return (
    <>
      <DashboardHeader
        title="Trading Dashboard"
        subtitle="Real-time perpetuals trading and analytics"
      />

      {currentAsset && (
        <div css={styles.chartContainer}>
          <AssetChart assetSymbol={currentAsset.symbol} assetId={currentAsset.assetId} />
        </div>
      )}
    </>
  );
}
