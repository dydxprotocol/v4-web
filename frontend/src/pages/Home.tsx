import { useEffect } from 'react';
import { NetworkSwitchContext } from '@/contexts/network-switch/network-switch.context';
import { getEnv } from '@/lib/env';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import * as styles from './Home.css';

const testNetUrl = 'https://starboard.squids.live/starboard-testnet@test2/api/graphql';
const localNodeUrl = getEnv('VITE_INDEXER_URL');

export default function Home() {
  const tradingSdk = useTradingSdk();
  const fetchedPosition = useSdkQuery(() => tradingSdk.getPositionById('181-0-28' as any));

  const networkSwitch = useRequiredContext(NetworkSwitchContext);
  const currentNetwork = networkSwitch.getNetworkUrl();

  function switchToTestNet() {
    networkSwitch.changeNetworkUrl(testNetUrl);
  }
  function switchToLocalNode() {
    networkSwitch.changeNetworkUrl(localNodeUrl);
  }

  useEffect(() => {
    tradingSdk.fetchCurrentPositions(
      '0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770' as any
    );
  }, [tradingSdk]);

  return (
    <div css={styles.page}>
      <div css={styles.container}>
        <div css={styles.header}>
          <h1 css={styles.title}>Starboard</h1>
          <p css={styles.subtitle}>Decentralized perpetuals trading on Fuel</p>
        </div>

        <div css={styles.statusCard}>
          <h2 css={styles.statusTitle}>Indexer Status</h2>
          <h2 css={styles.statusTitle}>Current network: {networkSwitch.getNetworkUrl()}</h2>

          {fetchedPosition && (
            <p css={styles.statusSuccess}>
              ✓ Connected. Found position with id {fetchedPosition?.id}
            </p>
          )}
        </div>

        <div css={styles.buttonContainer}>
          <button
            css={currentNetwork === testNetUrl ? styles.button : styles.buttonSecondary}
            onClick={switchToTestNet}
          >
            Testnet
          </button>
          <button
            css={currentNetwork === localNodeUrl ? styles.button : styles.buttonSecondary}
            onClick={switchToLocalNode}
          >
            Local node
          </button>
        </div>
      </div>
    </div>
  );
}
