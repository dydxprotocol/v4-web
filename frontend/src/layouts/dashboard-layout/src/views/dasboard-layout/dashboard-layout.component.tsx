import { Outlet } from 'react-router';
import { WalletContext } from '@/contexts/wallet/wallet.context';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import logoStarboard from '@/assets/logo-starboard.png';
import { AssetSelect } from './components/asset-select.component';
import * as styles from './dashboard-layout.css';

export function DashboardLayout() {
  const wallet = useRequiredContext(WalletContext);
  const isWalletConnected = wallet.isUserConnected();

  async function handleWalletClick() {
    if (!wallet.isUserConnected()) await wallet.establishConnection();
    else wallet.disconnect();
  }

  return (
    <div css={styles.page}>
      <header css={styles.header}>
        <div>
          <img src={logoStarboard} alt="Starboard" css={styles.logo} />
        </div>

        <AssetSelect />

        <div css={styles.headerRight}>
          <button
            onClick={handleWalletClick}
            css={isWalletConnected ? styles.walletConnected : styles.walletButton}
          >
            {isWalletConnected ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main css={styles.container}>
        <Outlet />
      </main>
    </div>
  );
}
