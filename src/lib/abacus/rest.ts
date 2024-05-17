import type { Nullable, kollections } from '@dydxprotocol/v4-abacus';

import type { AbacusRestProtocol } from '@/constants/abacus';
import { lastSuccessfulRestRequestByOrigin } from '@/constants/analytics';

import { log } from '../telemetry';

type Headers = Nullable<kollections.Map<string, string>>;
type FetchResponseCallback = (p0: Nullable<string>, p1: number, p2: Nullable<string>) => void;

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

    if (!url) {
      callback(null, 0, null);
      return;
    }

    fetch(url, options)
      .then(async (response) => {
        const data = await response.text();
        const headersObj: Record<string, string> = {};
        response.headers.forEach(([key, value]) => {
          headersObj[key] = value;
        });
        // Stringify the headers object
        const headersJson = JSON.stringify(headersObj);

        callback(data, response.status, headersJson);

        try {
          lastSuccessfulRestRequestByOrigin[new URL(url).origin] = Date.now();
        } catch (error) {
          log('AbacusRest/request', error);
        }
      })
      .catch(() => callback(null, 0, null)); // Network error or request couldn't be made
  }

  private mapToHeaders(map: Headers): HeadersInit {
    return new globalThis.Headers(map?.toArray().map(({ k, v }) => [k, v]));
  }
}

export default AbacusRest;
