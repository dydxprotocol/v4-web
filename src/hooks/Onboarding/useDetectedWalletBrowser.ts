import { useEffect, useState } from 'react';

export enum WalletBrowser {
  Metamask,
  Trust,
  Coinbase,
  Rainbow,
  imToken,
  Standard,
}

export function useDetectedWalletBrowser(): {
  detectedBrowser: WalletBrowser;
  userAgent?: string;
} {
  const [detectedBrowser, setDetectedBrowser] = useState<WalletBrowser>(WalletBrowser.Standard);
  const [userAgent, setUserAgent] = useState<string>();
  useEffect(() => {
    const ua = navigator.userAgent;

    const browser = /MetaMask/i.test(ua)
      ? WalletBrowser.Metamask
      : /Trust/i.test(ua)
        ? WalletBrowser.Trust
        : /CoinbaseWallet|Coinbase/i.test(ua)
          ? WalletBrowser.Coinbase
          : /Rainbow/i.test(ua)
            ? WalletBrowser.Rainbow
            : /imToken/i.test(ua)
              ? WalletBrowser.imToken
              : WalletBrowser.Standard;

    setUserAgent(ua);
    setDetectedBrowser(browser);
  }, []);

  return {
    detectedBrowser,
    userAgent,
  };
}
