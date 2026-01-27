import { Outlet } from 'react-router';
import logoStarboard from '@/assets/logo-starboard.png';
import { WalletContext } from '@/contexts/WalletContext/WalletContext';
import { envs } from '@/lib/env';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { WalletCollateralCard } from '../../components/WalletCollateralCard';
import * as styles from './DashboardLayout.css';
import { MarketStats } from './components/MarketStats';
import { MintButton } from './components/MintButton';

export function DashboardLayout() {
  const wallet = useRequiredContext(WalletContext);
  const isWalletConnected = wallet.isUserConnected();

  async function connectOrDisconnectWallet() {
    if (!wallet.isUserConnected()) await wallet.establishConnection();
    else wallet.disconnect();
  }

  return (
    <div css={styles.page}>
      <header css={styles.header}>
        <div css={styles.headerLeft}>
          <img src={logoStarboard} alt="Starboard" css={styles.logo} />

          <MarketStats />
        </div>

        <div css={styles.headerRight}>
          {envs.isDev() && isWalletConnected && <MintButton />}
          {isWalletConnected && <WalletCollateralCard />}
          <button
            onClick={connectOrDisconnectWallet}
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
