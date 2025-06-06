import { useEffect, useState } from 'react';

type WalletBrowser =
  | 'MetaMask In-App Browser'
  | 'Trust Wallet In-App Browser'
  | 'Coinbase Wallet In-App Browser'
  | 'Rainbow Wallet In-App Browser'
  | 'imToken In-App Browser'
  | 'Standard Browser or Unknown';

export function useDetectedWalletBrowser(): WalletBrowser {
  const [detectedBrowser, setDetectedBrowser] = useState<WalletBrowser>(
    'Standard Browser or Unknown'
  );

  useEffect(() => {
    const ua = navigator.userAgent;

    const browser = /MetaMask/i.test(ua)
      ? 'MetaMask In-App Browser'
      : /Trust/i.test(ua)
        ? 'Trust Wallet In-App Browser'
        : /CoinbaseWallet|Coinbase/i.test(ua)
          ? 'Coinbase Wallet In-App Browser'
          : /Rainbow/i.test(ua)
            ? 'Rainbow Wallet In-App Browser'
            : /imToken/i.test(ua)
              ? 'imToken In-App Browser'
              : 'Standard Browser or Unknown';

    setDetectedBrowser(browser);
  }, []);

  return detectedBrowser;
}
