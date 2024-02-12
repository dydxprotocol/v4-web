import styled, { type AnyStyledComponent } from 'styled-components';

import { Nullable } from '@/constants/abacus';

export type AssetSymbol = keyof typeof assetIcons;

const assetIcons = {
  '1INCH': '/currencies/1inch.png',
  AAVE: '/currencies/aave.png',
  ADA: '/currencies/ada.png',
  ALGO: '/currencies/algo.png',
  APE: '/currencies/ape.png',
  APT: '/currencies/apt.png',
  ARB: '/currencies/arb.png',
  ATOM: '/currencies/atom.png',
  AVAX: '/currencies/avax.png',
  BCH: '/currencies/bch.png',
  BLUR: '/currencies/blur.png',
  BNB: '/currencies/bnb.png',
  BONK: '/currencies/bonk.png',
  BTC: '/currencies/btc.png',
  CELO: '/currencies/celo.png',
  COMP: '/currencies/comp.png',
  CRV: '/currencies/crv.png',
  DAI: '/currencies/dai.png',
  DOGE: '/currencies/doge.png',
  DOT: '/currencies/dot.png',
  DYDX: '/currencies/dydx.png',
  DYM: '/currencies/dym.png',
  ENJ: '/currencies/enj.png',
  EOS: '/currencies/eos.png',
  ETC: '/currencies/etc.png',
  ETH: '/currencies/eth.png',
  FIL: '/currencies/fil.png',
  ICP: '/currencies/icp.png',
  JUP: '/currencies/jup.png',
  LDO: '/currencies/ldo.png',
  LINK: '/currencies/link.png',
  LTC: '/currencies/ltc.png',
  MATIC: '/currencies/matic.png',
  MKR: '/currencies/mkr.png',
  NEAR: '/currencies/near.png',
  OP: '/currencies/op.png',
  PEPE: '/currencies/pepe.png',
  RUNE: '/currencies/rune.png',
  SEI: '/currencies/sei.png',
  SHIB: '/currencies/shib.png',
  SNX: '/currencies/snx.png',
  SOL: '/currencies/sol.png',
  SUI: '/currencies/sui.png',
  SUSHI: '/currencies/sushi.png',
  TIA: '/currencies/tia.png',
  TRX: '/currencies/trx.png',
  UMA: '/currencies/uma.png',
  UNI: '/currencies/uni.png',
  USDC: '/currencies/usdc.png',
  USDT: '/currencies/usdt.png',
  WBTC: '/currencies/wbtc.png',
  WETH: '/currencies/weth.png',
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
  symbol != null && assetIcons.hasOwnProperty(symbol);

export const AssetIcon = ({
  symbol,
  className,
}: {
  symbol?: Nullable<string>;
  className?: string;
}) => (
  <Styled.Img
    src={isAssetSymbol(symbol) ? assetIcons[symbol] : '/currencies/unavailable.png'}
    className={className}
    alt={symbol}
  />
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Img = styled.img`
  width: auto;
  height: 1em;
`;
