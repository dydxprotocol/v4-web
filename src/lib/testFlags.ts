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
      this.queryParams[key] = value;
    }
  }

  get displayInitializingMarkets() {
    return !!this.queryParams.displayInitializingMarkets;
  }

  get withCCTP() {
    return !!this.queryParams.withCCTP;
  }
}

export const testFlags = new TestFlags();
