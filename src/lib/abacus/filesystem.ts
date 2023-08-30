import type { AbacusFileSystemProtocol, FileLocation, Nullable } from '@/constants/abacus';
import { NETWORK_ENDPOINTS } from '@/constants/networks';

export const ENDPOINTS_PATH =
  import.meta.env.MODE === 'production'
    ? 'config/prod/endpoints.json'
    : 'config/staging/dev_endpoints.json';

class AbacusFileSystem implements AbacusFileSystemProtocol {
  readTextFile(location: FileLocation, path: string): Nullable<string> {
    if (path === ENDPOINTS_PATH) {
      return JSON.stringify(NETWORK_ENDPOINTS);
    }

    return null;
  }

  writeTextFile(path: string, text: string): boolean {
    return true;
  }
}

export default AbacusFileSystem;
