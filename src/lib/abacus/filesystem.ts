import type { AbacusFileSystemProtocol, FileLocation, Nullable } from '@/constants/abacus';

class AbacusFileSystem implements AbacusFileSystemProtocol {
  readTextFile(location: FileLocation, path: string): Nullable<string> {
    return null;
  }

  writeTextFile(path: string, text: string): boolean {
    return true;
  }
}

export default AbacusFileSystem;
