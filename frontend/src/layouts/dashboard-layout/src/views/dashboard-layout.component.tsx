import { Link, Outlet } from 'react-router';
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
      <header css={styles.header}>
        <div css={styles.headerLeft}>
          <div css={styles.logo}>Starboard</div>
          <nav css={styles.nav}>
            <Link to="/" css={styles.navLink}>
              Dashboard
            </Link>
            <Link to="/trade" css={styles.navLink}>
              Trade
            </Link>
          </nav>
        </div>

        <div css={styles.networkSection}>
          <span css={styles.networkLabel}>Network</span>
          <div css={styles.networkSelector}>
            {NETWORKS.map((network) => (
              <button
                onClick={() => switchTo(network)}
                key={network}
                css={currentNetwork === network ? styles.buttonActive : styles.button}
              >
                {NETWORK_DISPLAY_VALUES[network]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main css={styles.container}>
        <Outlet />
      </main>
    </div>
  );
}

const NETWORK_DISPLAY_VALUES: Record<Network, string> = {
  local: 'Local Node',
  testnet: 'Testnet',
};
