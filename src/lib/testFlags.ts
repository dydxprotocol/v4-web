class TestFlags {
  public queryParams: { [key: string]: string };

  constructor() {
    this.queryParams = {};
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return;

    const queryParamsString = hash.substring(queryIndex + 1);
    const params = new URLSearchParams(queryParamsString);

    for (const [key, value] of params) {
      this.queryParams[key.toLowerCase()] = value;
    }
  }

  get displayInitializingMarkets() {
    return !!this.queryParams.displayinitializingmarkets;
  }

  get showMobileSignInOption() {
    return !!this.queryParams.mobilesignin;
  }

  get addressOverride():string {
    return this.queryParams.address;
  }
}

export const testFlags = new TestFlags();
