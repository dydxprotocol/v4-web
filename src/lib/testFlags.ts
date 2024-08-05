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

  get isolatedMargin() {
    return !!this.queryParams.isolatedmargin;
  }

  get enableComplianceApi() {
    return !!this.queryParams.complianceapi;
  }

  get enableVaults() {
    return !!this.queryParams.vaults;
  }

  get referrer() {
    return this.queryParams.utm_source;
  }

  get enablePredictionMarketPerp() {
    return !!this.queryParams.prediction;
  }

  get ohlc() {
    // When enabled, empty (0 trade) candles in markets will show O(pen) H(igh) L(ow) C(lose) data via mid-price.
    // When disabled, candles will only display OHLC data from historical trades.
    return !!this.queryParams.ohlc;
  }
}

export const testFlags = new TestFlags();
