import { isDev, isTestnet } from '@/constants/networks';

class TestFlags {
  public queryParams: { [key: string]: string };

  constructor() {
    this.queryParams = {};

    if (import.meta.env.VITE_ROUTER_TYPE === 'hash') {
      const hash = window.location.hash;
      const queryIndex = hash.indexOf('?');
      if (queryIndex === -1) return;

      const queryParamsString = hash.substring(queryIndex + 1);
      const params = new URLSearchParams(queryParamsString);

      params.forEach((value, key) => {
        this.queryParams[key.toLowerCase()] = value;
      });
    } else {
      const params = new URLSearchParams(window.location.search);

      params.forEach((value, key) => {
        this.queryParams[key.toLowerCase()] = value;
      });
    }
  }

  get displayInitializingMarkets() {
    return !!this.queryParams.displayinitializingmarkets;
  }

  get addressOverride(): string | undefined {
    return this.queryParams.address;
  }

  get enableVaults() {
    return !!this.queryParams.vaults || isDev || isTestnet;
  }

  get referrer() {
    return this.queryParams.utm_source;
  }

  get enablePredictionMarketPerp() {
    return !!this.queryParams.prediction || isDev;
  }

  get pml() {
    return !!this.queryParams.pml || isDev || isTestnet;
  }

  get showLimitClose() {
    return !!this.queryParams.limitclose;
  }

  get referralCode() {
    return this.queryParams.ref;
  }

  get enableStaticTyping() {
    if (this.queryParams.statictyping === 'false') return false;
    return !!this.queryParams.statictyping || isDev;
  }

  get uiRefresh() {
    return !!this.queryParams.uirefresh || isDev;
  }

  get onboardingRewrite() {
    return !!this.queryParams.onboarding_rewrite;
  }
}

export const testFlags = new TestFlags();
