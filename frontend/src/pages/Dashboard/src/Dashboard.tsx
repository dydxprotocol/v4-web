import { useCallback } from 'react';
import type { AssetId } from 'fuel-ts-sdk';
import type { Candle, CandleInterval } from 'fuel-ts-sdk/trading';
import type { FieldErrors } from 'react-hook-form';
import { TradingChart } from '@/components/TradingChart';
import { useTradingSdk } from '@/lib/fuel-ts-sdk';
import { OrderEntryForm } from '@/modules/order-entry-form';
import type { OrderEntryFormModel } from '@/modules/order-entry-form/src/models';
import { PublicSales } from './components';
import * as styles from './Dashboard.css';

const DEFAULT_ASSET = '0xa3ed2e58076f53e8dd15c8463ee49e6ce547355c34c639777c5dace3728e2ded';

export function Dashboard() {
  const tradingSdk = useTradingSdk();

  const getOrFetchCandles = useCallback(
    async (interval: CandleInterval): Promise<Candle[]> => {
      const assetId = DEFAULT_ASSET as AssetId;
      const status = tradingSdk.getCandlesStatus(assetId, interval);

      if (status === 'uninitialized') {
        await tradingSdk.fetchCandles(assetId, interval);
      }

      return tradingSdk.getCandles(assetId, interval);
    },
    [tradingSdk]
  );

  function handleOrderSubmitSuccess(formData: OrderEntryFormModel) {
    // Handle success - can be extended later
    console.log('Order submitted:', formData);
  }

  function handleOrderSubmitFailure(errors: FieldErrors<OrderEntryFormModel>) {
    // Handle failure - can be extended later
    console.error('Order submission failed:', errors);
  }

  return (
    <div css={styles.page}>
      <div css={styles.container}>
        {/* Left side - Chart */}
        <div css={styles.chartSection}>
          <TradingChart symbol="XHT/USDT" candlesGetter={getOrFetchCandles} />
        </div>

        {/* Right side - Public Sales and Order Entry */}
        <div css={styles.rightSection}>
          <div css={styles.publicSalesContainer}>
            <PublicSales />
          </div>
          <div css={styles.orderEntryContainer}>
            <h2 css={styles.orderEntryTitle}>Order Entry</h2>
            <div css={styles.orderEntryFormWrapper}>
              <OrderEntryForm
                baseAssetName="XHT"
                quoteAssetName="USDT"
                userBalanceInQuoteAsset={2.137}
                userBalanceInBaseAsset={0.1337}
                currentQuoteAssetPrice={365.32}
                onSubmitSuccessful={handleOrderSubmitSuccess}
                onSubmitFailure={handleOrderSubmitFailure}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

