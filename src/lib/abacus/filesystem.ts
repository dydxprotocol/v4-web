import type { AbacusFileSystemProtocol, FileLocation, Nullable } from '@/constants/abacus';

class AbacusFileSystem implements AbacusFileSystemProtocol {
  readTextFile(location: FileLocation, path: string): Nullable<string> {
    console.log({ location, path });
    if (path === 'config/staging/environments.json') {
      console.log('ENVIRONMENT_CONFIGS', globalThis.ENVIRONMENT_CONFIGS);
      return JSON.stringify(globalThis.ENVIRONMENT_CONFIGS);
    }

    return null;
  }

  writeTextFile(path: string, text: string): boolean {
    return true;
  }
}

export default AbacusFileSystem;
