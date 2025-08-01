import { useEffect, useState } from 'react';

// Supported Wallet Browsers w/ Version tested
export enum WalletBrowser {
  Metamask, // iOS v7.51.1 | Android v7.51.0
  Trust, // iOS v11.46 | Android v8.55.0
  Coinbase, // iOS v29.52 | Android v29.51.0
  Rainbow, // iOS v1.9.72 | Android v1.9.72
  imToken, // iOS v2.17.1 | Android v2.17.1
  Phantom, // iOS 25.27.0 | Android v25.27.0
  Standard,
}

/**
 * @description Detects the wallet browser based on the User Agent and the Ethereum Provider. In wallet browsers, the User Agent is not reliable, so we should also use the Ethereum Provider to detect the wallet browser.
 * @returns The detected wallet browser
 */
export function useDetectedWalletBrowser(): {
  detectedBrowser: WalletBrowser;
} {
  const [detectedBrowser, setDetectedBrowser] = useState<WalletBrowser>(WalletBrowser.Standard);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ethProvider = window.ethereum;

    const isMobileBrowser = /iPhone|iPad|iPod|Android|WebView|Mobile/i.test(ua);

    if (!isMobileBrowser) {
      return;
    }

    /**
     * Check User Agent for any hints to the wallet browser
     */
    const browser = /MetaMask/i.test(ua)
      ? WalletBrowser.Metamask
      : /Phantom/i.test(ua)
        ? WalletBrowser.Phantom
        : /imToken/i.test(ua)
          ? WalletBrowser.imToken
          : undefined;

    /**
     * If the browser is not detected through User Agent, check for flags on the Ethereum Provider
     */
    if (browser == null) {
      if (ethProvider?.isRainbow) {
        setDetectedBrowser(WalletBrowser.Rainbow);
      } else if (ethProvider?.isCoinbaseWallet || ethProvider?.isCoinbaseBrowser) {
        setDetectedBrowser(WalletBrowser.Coinbase);
      } else if (ethProvider?.isTrustWallet || ethProvider?.isTrust) {
        setDetectedBrowser(WalletBrowser.Trust);
      } else if (ethProvider?.isImToken) {
        setDetectedBrowser(WalletBrowser.imToken);
      } else if (ethProvider?.isPhantom) {
        setDetectedBrowser(WalletBrowser.Phantom);
      }
    } else {
      setDetectedBrowser(browser);
    }
  }, []);

  return {
    detectedBrowser,
  };
}
