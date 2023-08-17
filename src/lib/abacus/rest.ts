import type { Nullable, kollections } from '@dydxprotocol/abacus';

import type { AbacusRestProtocol } from '@/constants/abacus';

type Headers = Nullable<kollections.Map<string, string>>;
type FetchResponseCallback = (p0: Nullable<string>, p1: number) => void;

class AbacusRest implements AbacusRestProtocol {
  get(url: string, headers: Headers, callback: FetchResponseCallback): void {
    this.request('GET', url, headers, null, callback);
  }

  post(
    url: string,
    headers: Headers,
    body: Nullable<string>,
    callback: FetchResponseCallback
  ): void {
    this.request('POST', url, headers, body, callback);
  }

  put(
    url: string,
    headers: Headers,
    body: Nullable<string>,
    callback: FetchResponseCallback
  ): void {
    this.request('PUT', url, headers, body, callback);
  }

  delete(url: string, headers: Headers, callback: FetchResponseCallback): void {
    this.request('DELETE', url, headers, null, callback);
  }

  private request(
    method: string,
    url: string,
    headers: Headers,
    body: Nullable<string>,
    callback: FetchResponseCallback
  ): void {
    const options: RequestInit = {
      method,
      headers: this.mapToHeaders(headers),
      body,
    };

    fetch(url, options)
      .then((response) =>
        response.text().then((data) => {
          if (response.ok) {
            callback(data, response.status);
          } else {
            // response not OK, call callback with null data and the status, this includes 400/500 status codes
            callback(null, response.status);
          }
        })
      )
      .catch(() => callback(null, 0)); // Network error or request couldn't be made
  }

  private mapToHeaders(map: Headers): HeadersInit {
    return new globalThis.Headers(map?.toArray().map(({ k, v }) => [k, v]));
  }
}

export default AbacusRest;
