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

      for (const [key, value] of params) {
        this.queryParams[key.toLowerCase()] = value;
      }
    } else {
      const params = new URLSearchParams(window.location.search);

      for (const [key, value] of params) {
        this.queryParams[key.toLowerCase()] = value;
      }
    }
  }

  get displayInitializingMarkets() {
    return !!this.queryParams.displayinitializingmarkets;
  }

  get addressOverride(): string {
    return this.queryParams.address;
  }

  get configureSlTpFromPositionsTable() {
    return !!this.queryParams.sltp;
  }

  get enableConditionalLimitOrders() {
    return !!this.queryParams.sltplimit;
  }

  get isolatedMargin() {
    return !!this.queryParams.isolatedmargin;
  }

  get displayPrivyLogin() {
    return !!this.queryParams.displayprivylogin || true;
  }
}

export const testFlags = new TestFlags();
