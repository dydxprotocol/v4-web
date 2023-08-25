import styled, { type AnyStyledComponent } from 'styled-components';

import { Nullable } from '@/constants/abacus';

export type AssetSymbol = keyof typeof assetIcons;

const assetIcons = {
  '1INCH': '/currencies/1inch.svg',
  AAVE: '/currencies/aave.svg',
  ADA: '/currencies/ada.svg',
  ALGO: '/currencies/algo.svg',
  ATOM: '/currencies/atom.svg',
  AVAX: '/currencies/avax.svg',
  BCH: '/currencies/bch.svg',
  BTC: '/currencies/btc.svg',
  CELO: '/currencies/celo.svg',
  COMP: '/currencies/comp.svg',
  CRV: '/currencies/crv.svg',
  DAI: '/currencies/dai.svg',
  DOGE: '/currencies/doge.svg',
  DOT: '/currencies/dot.svg',
  DYDX: '/currencies/dydx.svg',
  ENJ: '/currencies/enj.svg',
  EOS: '/currencies/eos.svg',
  ETC: '/currencies/etc.svg',
  ETH: '/currencies/eth.svg',
  FIL: '/currencies/fil.svg',
  ICP: '/currencies/icp.svg',
  LINK: '/currencies/link.svg',
  LTC: '/currencies/ltc.svg',
  LUNA: '/currencies/luna.svg',
  MATIC: '/currencies/matic.svg',
  MKR: '/currencies/mkr.svg',
  NEAR: '/currencies/near.svg',
  RUNE: '/currencies/rune.svg',
  SNX: '/currencies/snx.svg',
  SOL: '/currencies/sol.svg',
  SUSHI: '/currencies/sushi.svg',
  TRX: '/currencies/trx.svg',
  UMA: '/currencies/uma.svg',
  UNI: '/currencies/uni.svg',
  USDC: '/currencies/usdc.svg',
  USDT: '/currencies/usdt.svg',
  WBTC: '/currencies/wbtc.svg',
  WETH: '/currencies/weth.svg',
  XLM: '/currencies/xlm.svg',
  XMR: '/currencies/xmr.svg',
  XTZ: '/currencies/xtz.svg',
  YFI: '/currencies/yfi.svg',
  ZEC: '/currencies/zec.svg',
  ZRX: '/currencies/zrx.svg',
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
