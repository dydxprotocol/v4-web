import * as styles from './public-sales.css';

interface Trade {
  price: string;
  size: string;
  time: string;
  side: 'buy' | 'sell';
}

// Hardcoded mock data matching the image
const MOCK_TRADES: Trade[] = [
  { price: '0.3342', size: '1085', time: '13:07:50', side: 'sell' },
  { price: '0.3343', size: '1064', time: '12:59:47', side: 'buy' },
  { price: '0.3358', size: '5198', time: '08:32:24', side: 'buy' },
  { price: '0.3357', size: '5493', time: '08:29:06', side: 'buy' },
  { price: '0.3341', size: '1234', time: '08:15:12', side: 'sell' },
  { price: '0.3345', size: '987', time: '08:10:33', side: 'buy' },
  { price: '0.3340', size: '2567', time: '08:05:18', side: 'sell' },
  { price: '0.3348', size: '3456', time: '08:00:45', side: 'buy' },
];

export function PublicSales() {
  return (
    <div css={styles.container}>
      <h2 css={styles.title}>PUBLIC SALES</h2>
      <div css={styles.tableContainer}>
        <table css={styles.table}>
          <thead>
            <tr>
              <th css={styles.headerCell}>Price</th>
              <th css={styles.headerCell}>Size XHT</th>
              <th css={styles.headerCell}>Time</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRADES.map((trade, index) => (
              <tr key={index} css={styles.row}>
                <td css={[styles.cell, trade.side === 'buy' ? styles.buyPrice : styles.sellPrice]}>
                  {trade.price}
                </td>
                <td css={styles.cell}>{trade.size}</td>
                <td css={styles.cell}>{trade.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
