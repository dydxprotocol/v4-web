import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';

import { INJECTIVE_BECH32_PREFIX } from '@/constants/graz';

export const createInjectiveLocalWalletFromMnemonic = async (mnemonic: string) =>
  (await getLazyLocalWallet()).fromEthSecp256k1Mnemonic(mnemonic, INJECTIVE_BECH32_PREFIX);
