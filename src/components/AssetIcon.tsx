import styled from 'styled-components';

import { Nullable } from '@/constants/abacus';

export type AssetSymbol = keyof typeof assetIcons;

const assetIcons = {
  '1INCH': '/currencies/1inch.png',
  AAVE: '/currencies/aave.png',
  ADA: '/currencies/ada.png',
  AEVO: '/currencies/aevo.png',
  AGIX: '/currencies/agix.png',
  ALGO: '/currencies/algo.png',
  APE: '/currencies/ape.png',
  API3: '/currencies/api3.png',
  APT: '/currencies/apt.png',
  ARB: '/currencies/arb.png',
  ARKM: '/currencies/arkm.png',
  ASTR: '/currencies/astr.png',
  ATOM: '/currencies/atom.png',
  AVAX: '/currencies/avax.png',
  AXL: '/currencies/axl.png',
  BCH: '/currencies/bch.png',
  BLUR: '/currencies/blur.png',
  BNB: '/currencies/bnb.png',
  BOME: '/currencies/bome.png',
  BONK: '/currencies/bonk.png',
  BTC: '/currencies/btc.png',
  CELO: '/currencies/celo.png',
  CHZ: '/currencies/chz.png',
  COMP: '/currencies/comp.png',
  CRV: '/currencies/crv.png',
  DAI: '/currencies/dai.png',
  DOGE: '/currencies/doge.png',
  DOT: '/currencies/dot.png',
  DYDX: '/currencies/dydx.png',
  DYM: '/currencies/dym.png',
  ENJ: '/currencies/enj.png',
  ENS: '/currencies/ens.png',
  EOS: '/currencies/eos.png',
  ETC: '/currencies/etc.png',
  ETH: '/currencies/eth.png',
  ETHFI: '/currencies/ethfi.png',
  FET: '/currencies/fet.png',
  FIL: '/currencies/fil.png',
  FLR: '/currencies/flr.png',
  FTM: '/currencies/ftm.png',
  GALA: '/currencies/gala.png',
  GMT: '/currencies/gmt.png',
  GRT: '/currencies/grt.png',
  HBAR: '/currencies/hbar.png',
  ICP: '/currencies/icp.png',
  IMX: '/currencies/imx.png',
  INJ: '/currencies/inj.png',
  JTO: '/currencies/jto.png',
  JUP: '/currencies/jup.png',
  KAVA: '/currencies/kava.png',
  LDO: '/currencies/ldo.png',
  LINK: '/currencies/link.png',
  LTC: '/currencies/ltc.png',
  MAGIC: '/currencies/magic.png',
  MANA: '/currencies/mana.png',
  MATIC: '/currencies/matic.png',
  MASK: '/currencies/mask.png',
  MEME: '/currencies/meme.png',
  MINA: '/currencies/mina.png',
  MKR: '/currencies/mkr.png',
  MOTHER: '/currencies/mother.png',
  NEAR: '/currencies/near.png',
  OCEAN: '/currencies/ocean.png',
  ORDI: '/currencies/ordi.png',
  OP: '/currencies/op.png',
  PEPE: '/currencies/pepe.png',
  PORTAL: '/currencies/portal.png',
  PYTH: '/currencies/pyth.png',
  RNDR: '/currencies/rndr.png',
  RUNE: '/currencies/rune.png',
  SAND: '/currencies/sand.png',
  SEI: '/currencies/sei.png',
  SHIB: '/currencies/shib.png',
  SNX: '/currencies/snx.png',
  SOL: '/currencies/sol.png',
  STRK: '/currencies/strk.png',
  STX: '/currencies/stx.png',
  SUI: '/currencies/sui.png',
  SUSHI: '/currencies/sushi.png',
  TIA: '/currencies/tia.png',
  TON: '/currencies/ton.png',
  TRX: '/currencies/trx.png',
  UMA: '/currencies/uma.png',
  UNI: '/currencies/uni.png',
  USDC: '/currencies/usdc.png',
  USDT: '/currencies/usdt.png',
  W: '/currencies/w.png',
  WBTC: '/currencies/wbtc.png',
  WETH: '/currencies/weth.png',
  WIF: '/currencies/wif.png',
  WOO: '/currencies/woo.png',
  WLD: '/currencies/wld.png',
  XLM: '/currencies/xlm.png',
  XMR: '/currencies/xmr.png',
  XRP: '/currencies/xrp.png',
  XTZ: '/currencies/xtz.png',
  YFI: '/currencies/yfi.png',
  ZEC: '/currencies/zec.png',
  ZETA: '/currencies/zeta.png',
  ZRX: '/currencies/zrx.png',
} as const;

const isAssetSymbol = (symbol: Nullable<string>): symbol is AssetSymbol =>
  symbol != null && Object.hasOwn(assetIcons, symbol);

export const AssetIcon = ({
  symbol,
  className,
}: {
  symbol?: Nullable<string>;
  className?: string;
}) => (
  <$Img
    src={isAssetSymbol(symbol) ? assetIcons[symbol] : '/currencies/unavailable.png'}
    className={className}
    alt={symbol ?? undefined}
  />
);
const $Img = styled.img`
  width: auto;
  height: 1em;
  border-radius: 50%;
`;
