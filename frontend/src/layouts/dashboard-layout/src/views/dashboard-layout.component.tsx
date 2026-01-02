import { Outlet } from 'react-router';
import { NetworkSwitchContext } from '@/contexts/network-switch/network-switch.context';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { NETWORKS, type Network } from '@/models/network';
import * as styles from './dashboard-layout.css';

export function DashboardLayout() {
  const networkSwitch = useRequiredContext(NetworkSwitchContext);
  const currentNetwork = networkSwitch.getCurrentNetwork();

  function switchTo(network: Network) {
    networkSwitch.changeNetwork(network);
  }

  return (
    <div css={styles.page}>
      <div css={styles.container}>
        <div css={styles.buttonContainer}>
          {NETWORKS.map((network) => (
            <button
              onClick={() => switchTo(network)}
              key={network}
              css={currentNetwork === network ? styles.button : styles.buttonSecondary}
            >
              {NETWORK_DISPLAY_VALUES[network]}
            </button>
          ))}
        </div>

        <h4 css={styles.statusTitle}>Indexer URL: {networkSwitch.getCurrentNetwork()}</h4>

        <Outlet />
      </div>
    </div>
  );
}

const NETWORK_DISPLAY_VALUES: Record<Network, string> = {
  local: 'Local Node',
  testnet: 'Testnet',
};
