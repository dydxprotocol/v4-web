import type { AbacusFileSystemProtocol, Nullable } from '@/constants/abacus';

class AbacusFileSystem implements AbacusFileSystemProtocol {
  readTextFile(): Nullable<string> {
    return null;
  }

  writeTextFile(): boolean {
    return true;
  }
}

export default AbacusFileSystem;
