import { DEV_ENDPOINTS, ENDPOINTS } from '@dydxprotocol/v4-localization';

import type { AbacusFileSystemProtocol, FileLocation, Nullable } from '@/constants/abacus';

export const ENDPOINTS_PATH =
  import.meta.env.MODE === 'production'
    ? 'config/prod/endpoints.json'
    : 'config/staging/dev_endpoints.json';

class AbacusFileSystem implements AbacusFileSystemProtocol {
  readTextFile(location: FileLocation, path: string): Nullable<string> {
    if (path === ENDPOINTS_PATH) {
      const environments = import.meta.env.MODE === 'production' ? ENDPOINTS : DEV_ENDPOINTS;
      return JSON.stringify(environments);
    }

    return null;
  }

  writeTextFile(path: string, text: string): boolean {
    return true;
  }
}

export default AbacusFileSystem;
