import type { AbacusFileSystemProtocol } from '@/constants/abacus';

import { Nullable } from '@/lib/typeUtils';

class AbacusFileSystem implements AbacusFileSystemProtocol {
  readTextFile(): Nullable<string> {
    return null;
  }

  writeTextFile(): boolean {
    return true;
  }
}

export default AbacusFileSystem;
