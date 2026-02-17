class TestFlags {
  public queryParams: { [key: string]: string };

  private isValueExplicitlyFalse = (value: string) =>
    ['false', '0', 'no', 'off'].includes(value.toLowerCase());

  private booleanFlag = (value?: string, defaultTrue?: boolean) => {
    if (!value) return defaultTrue ?? false;
    return !this.isValueExplicitlyFalse(value);
  };

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
    return this.booleanFlag(this.queryParams.displayinitializingmarkets);
  }

  get addressOverride(): string | undefined {
    return this.queryParams.address;
  }

  get referrer() {
    return this.queryParams.utm_source;
  }

  get showLimitClose() {
    return this.booleanFlag(this.queryParams.limitclose);
  }

  get referralCode() {
    return this.queryParams.ref;
  }

  get showNewDepositFlow() {
    return !!this.queryParams.deposit_rewrite;
  }

  get showNewWithdrawFlow() {
    return !!this.queryParams.withdraw_rewrite;
  }

  get simpleUi() {
    return this.queryParams.simpleui ? this.booleanFlag(this.queryParams.simpleui) : undefined;
  }

  get enableTurnkey() {
    return this.booleanFlag(this.queryParams.enable_turnkey);
  }

  get spot() {
    return this.booleanFlag(this.queryParams.spot);
  }
}

export const testFlags = new TestFlags();
