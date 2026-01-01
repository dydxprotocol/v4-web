import { Outlet } from 'react-router';
import { NetworkSwitchContext } from '@/contexts/network-switch/network-switch.context';
import { getEnv } from '@/lib/env';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import * as styles from './dashboard-layout.css';

const testNetUrl = 'https://starboard.squids.live/starboard-testnet@test2/api/graphql';
const localNodeUrl = getEnv('VITE_INDEXER_URL');

export function DashboardLayout() {
  const networkSwitch = useRequiredContext(NetworkSwitchContext);
  const currentNetwork = networkSwitch.getNetworkUrl();

  function switchToTestNet() {
    networkSwitch.changeNetworkUrl(testNetUrl);
  }

  function switchToLocalNode() {
    networkSwitch.changeNetworkUrl(localNodeUrl);
  }

  return (
    <div css={styles.page}>
      <div css={styles.container}>
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

        <h4 css={styles.statusTitle}>Indexer URL: {networkSwitch.getNetworkUrl()}</h4>

        <Outlet />
      </div>
    </div>
  );
}
