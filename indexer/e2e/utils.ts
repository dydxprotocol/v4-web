import { DateTime, FunctionInvocationScope, Provider, WalletUnlocked } from 'fuels';

export const USDC_ASSET = '0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c';
export const BNB_ASSET = '0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4';
export const BTC_ASSET = '0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de';
export const ETH_ASSET = '0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160';

export const BTC_MAX_LEVERAGE = 50 * 10_000;
export const ETH_MAX_LEVERAGE = 50 * 10_000;
export const BNB_MAX_LEVERAGE = 50 * 10_000;

export const DEFAULT_SUB_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';

// adsresses are hardcoded, taken from the fuel node starting script
export const DEPLOYER_ADDRESS =
  '0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6'; // 0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6
export const USER_0_ADDRESS = '0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770'; // 0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
export const USER_1_ADDRESS = '0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c'; // 0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c"
export const USER_2_ADDRESS = '0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b'; // 0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b"
export const LIQUIDATOR_ADDRESS =
  '0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088'; // 0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088"

// priv keys are hardcoded, taken from the fuel node starting script
export const DEPLOYER_PK = '0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a'; // 0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6
export const USER_0_PK = '0x366079294383ed426ef94b9e86a8e448876a92c1ead9bbf75e6e205a6f4f570d'; // 0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
export const USER_1_PK = '0xb978aa71a1487dc9c1f996493af73f0427cf78f560b606224e7f0089bae04c41'; // 0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c"
export const USER_2_PK = '0xb19556cb693d7850d0e75d05a6e2e4c9ed5691d9e5bc54a7d43ee6eed3ad5fe3'; // 0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b"
export const LIQUIDATOR_PK = '0xa5675fc7eb0657940fc73f6ec6c5265c045065ddac62e12e1174da030f3868b3'; // 0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088"

export function getArgs(requiredArgs: string[]) {
  const argsObject = process.argv.reduce(
    (args, arg) => {
      // long arg
      if (arg.slice(0, 2) === '--') {
        const longArg = arg.split('=');
        const longArgFlag = longArg[0].slice(2);
        const longArgValue = longArg.length > 1 ? longArg[1] : true;
        args[longArgFlag] = longArgValue;
      }
      // flags
      else if (arg[0] === '-') {
        const flags = arg.slice(1).split('');
        flags.forEach((flag) => {
          args[flag] = true;
        });
      }
      return args;
    },
    {} as Record<string, string | boolean>
  );
  requiredArgs.forEach((arg) => {
    if (!argsObject[arg]) {
      throw new Error(`Required argument ${arg} not provided`);
    }
  });
  return argsObject;
}

const GAS_BUFFER_MULTIPLIER = 1.2;

export async function call(fnCall: FunctionInvocationScope) {
  const { gasUsed } = await fnCall.getTransactionCost();
  // console.log("gasUsed", gasUsed.toString())
  const gasLimit = gasUsed.muln(GAS_BUFFER_MULTIPLIER).toString();

  const { waitForResult } = await fnCall.txParams({ gasLimit }).call();
  return waitForResult();
}

export function toPrice(value: number, decimals: number = 18): string {
  const v = BigInt(value) * BigInt(10) ** BigInt(decimals);
  return v.toString();
}

export async function moveBlockchainTime(
  providerWithCustomTimestamp: Provider,
  seconds: number,
  blocks: number = 3
) {
  const latestBlock = await providerWithCustomTimestamp.getBlock('latest');
  if (!latestBlock) {
    throw new Error('No latest block');
  }
  const latestBlockTimestamp = DateTime.fromTai64(latestBlock.time).toUnixMilliseconds();

  // Produce 3 new blocks, setting the timestamp to latest + seconds * 1000ms
  await providerWithCustomTimestamp.produceBlocks(blocks, latestBlockTimestamp + seconds * 1000);
}

export type AddressIdentity = { Address: { bits: string } };

export function walletToAddressIdentity(wallet: WalletUnlocked): AddressIdentity {
  return { Address: { bits: wallet.address.toHexString() } };
}

export function expandDecimals(value: number, decimals: number = 6): string {
  const v = BigInt(value) * BigInt(10) ** BigInt(decimals);
  return v.toString();
}

export function getBtcConfig(): [string, number] {
  return [
    BTC_ASSET,
    BTC_MAX_LEVERAGE, // max_leverage
  ];
}

export function getEthConfig(): [string, number] {
  return [
    ETH_ASSET,
    ETH_MAX_LEVERAGE, // max_leverage
  ];
}

export function getBnbConfig(): [string, number] {
  return [
    BNB_ASSET,
    BNB_MAX_LEVERAGE, // max_leverage
  ];
}
