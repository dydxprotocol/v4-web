import styled, { type AnyStyledComponent } from 'styled-components';

import { Nullable } from '@/constants/abacus';

export type AssetSymbol = keyof typeof assetIcons;

const assetIcons = {
  '1INCH': '/currencies/1inch.png',
  AAVE: '/currencies/aave.png',
  ADA: '/currencies/ada.png',
  ALGO: '/currencies/algo.png',
  ATOM: '/currencies/atom.png',
  AVAX: '/currencies/avax.png',
  BCH: '/currencies/bch.png',
  BTC: '/currencies/btc.png',
  CELO: '/currencies/celo.png',
  COMP: '/currencies/comp.png',
  CRV: '/currencies/crv.png',
  DAI: '/currencies/dai.png',
  DOGE: '/currencies/doge.png',
  DOT: '/currencies/dot.png',
  DYDX: '/currencies/dydx.png',
  ENJ: '/currencies/enj.png',
  EOS: '/currencies/eos.png',
  ETC: '/currencies/etc.png',
  ETH: '/currencies/eth.png',
  FIL: '/currencies/fil.png',
  ICP: '/currencies/icp.png',
  LINK: '/currencies/link.png',
  LTC: '/currencies/ltc.png',
  MATIC: '/currencies/matic.png',
  MKR: '/currencies/mkr.png',
  NEAR: '/currencies/near.png',
  RUNE: '/currencies/rune.png',
  SNX: '/currencies/snx.png',
  SOL: '/currencies/sol.png',
  SUSHI: '/currencies/sushi.png',
  TRX: '/currencies/trx.png',
  UMA: '/currencies/uma.png',
  UNI: '/currencies/uni.png',
  USDC: '/currencies/usdc.png',
  USDT: '/currencies/usdt.png',
  WBTC: '/currencies/wbtc.png',
  WETH: '/currencies/weth.png',
  XLM: '/currencies/xlm.png',
  XMR: '/currencies/xmr.png',
  XTZ: '/currencies/xtz.png',
  YFI: '/currencies/yfi.png',
  ZEC: '/currencies/zec.png',
  ZRX: '/currencies/zrx.png',
} as const;

export const AssetIcon = ({
  symbol,
  className,
}: {
  symbol?: Nullable<AssetSymbol>;
  className?: string;
}) => (symbol ? <Styled.Img src={assetIcons[symbol]} className={className} /> : null);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Img = styled.img`
  width: auto;
  height: 1em;
`;
