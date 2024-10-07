import { isDev } from '@/constants/networks';

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

  get addressOverride(): string {
    return this.queryParams.address;
  }

  get enableVaults() {
    return !!this.queryParams.vaults || isDev;
  }

  get referrer() {
    return this.queryParams.utm_source;
  }

  get enablePredictionMarketPerp() {
    return !!this.queryParams.prediction || isDev;
  }

  get pml() {
    return !!this.queryParams.pml;
  }

  get showLimitClose() {
    return !!this.queryParams.limitclose;
  }

  get referralCode() {
    return this.queryParams.ref;
  }

  get enableStaticTyping() {
    return !!this.queryParams.statictyping;
  }

  get uiRefresh() {
    return !!this.queryParams.uirefresh || isDev;
  }
}

export const testFlags = new TestFlags();
