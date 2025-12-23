import { useContext, useEffect, useState } from 'react';
import { StarboardClientContext } from '@/contexts/StarboardClient.context';
import * as styles from './Home.css';

export default function Home() {
  const client = useContext(StarboardClientContext);
  const [positionsCount, setPositionsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;

    const fetchPositions = async () => {
      setLoading(true);
      setError(null);
      try {
        const positions = await client.positions.getPositions({ limit: 100 });
        setPositionsCount(positions.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch positions');
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [client]);

  return (
    <div css={styles.page}>
      <div css={styles.container}>
        <div css={styles.header}>
          <h1 css={styles.title}>Starboard</h1>
          <p css={styles.subtitle}>Decentralized perpetuals trading on Fuel</p>
        </div>

        <div css={styles.statusCard}>
          <h2 css={styles.statusTitle}>Indexer Status</h2>
          {loading && <p css={styles.statusLoading}>⏳ Connecting to indexer...</p>}
          {error && <p css={styles.statusError}>⚠️ {error}</p>}
          {positionsCount !== null && (
            <p css={styles.statusSuccess}>
              ✓ Connected. Found {positionsCount} position{positionsCount !== 1 ? 's' : ''}.
            </p>
          )}
        </div>

        <div css={styles.buttonContainer}>
          <button css={styles.button}>Launch App</button>
          <button css={styles.buttonSecondary}>Documentation</button>
        </div>
      </div>
    </div>
  );
}
