import * as styles from './Dashboard.css';
import { DashboardOrderEntryForm } from './components/dashboard-order-entry-form.component';
import { DashboardTradingChart } from './components/dashboard-trading-chart.component';
import { PositionsList } from './components/positions-list.component';

export function Dashboard() {
  return (
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
  );
}
