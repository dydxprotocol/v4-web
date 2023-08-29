import type { AbacusFileSystemProtocol, FileLocation, Nullable } from '@/constants/abacus';
import { DEV_ENDPOINTS, ENDPOINTS } from '@dydxprotocol/v4-localization';

class AbacusFileSystem implements AbacusFileSystemProtocol {
  readTextFile(location: FileLocation, path: string): Nullable<string> {
    if (path === 'config/staging/environments.json') {
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
