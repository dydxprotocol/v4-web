import { useTradingSdk } from '@/lib/fuel-ts-sdk';
import { usePolling } from '@/lib/usePolling';
import * as styles from './Dashboard.css';
import { DashboardOrderEntryForm } from './components/DashboardOrderEntryForm';
import { DashboardTradingChart } from './components/DashboardTradingChart';
import { PositionsList } from './components/PositionsList';

export function Dashboard() {
  return (
    <>
      <div css={styles.page}>
        <div css={styles.container}>
          <div css={styles.chartSection}>
            <DashboardTradingChart />
          </div>

          <div css={styles.rightSection}>
            <div css={styles.orderEntryContainer}>
              <h2 css={styles.orderEntryTitle}>Order Entry</h2>
              <div css={styles.orderEntryFormWrapper}>
                <DashboardOrderEntryForm />
              </div>
            </div>
            <PositionsList />
          </div>
        </div>
      </div>

      <BackgroundPricesPolling />
    </>
  );
}

const BackgroundPricesPolling = () => {
  const trading = useTradingSdk();

  usePolling(trading.workflows.fetchLatestBaseAndWatchedAssetsPrices);

  return null;
};
