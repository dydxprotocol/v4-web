import { useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { TradeLayouts } from '@/constants/layout';

import { useCurrentSpotToken } from '@/hooks/useCurrentSpotToken';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { SpotTvChart } from '@/views/charts/TradingView/SpotTvChart';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedTradeLayout } from '@/state/layoutSelectors';

import { SpotHeader } from './SpotHeader';
import { type SpotHoldingRow } from './SpotHoldingsTable';
import { SpotHorizontalPanel } from './SpotHorizontalPanel';
import { SpotTokenInfo } from './SpotTokenInfo';
import { SpotTradeForm } from './SpotTradeForm';
import { SpotMarketToken } from './types';

function generateDummyHoldings(count: number): SpotHoldingRow[] {
  const rows: SpotHoldingRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const tokenSymbol = `${i} ASSET`;
    const tokenName = `${[...tokenSymbol].reverse().join('')}`;
    const holdingsAmount = Math.round(1000 + Math.random() * 2_000_000);
    const avgPrice = 0.0001 + Math.random() * 5;
    const holdingsUsd = Math.round(holdingsAmount * avgPrice);
    const boughtAmount = holdingsAmount;
    const boughtUsd = holdingsUsd;
    const soldAmount = Math.round(Math.random() * 10_000);
    const soldUsd = Math.round(soldAmount * avgPrice);
    const pnlUsd = Math.round((Math.random() - 0.5) * 10_000);

    rows.push({
      tokenAddress: tokenSymbol,
      tokenSymbol,
      tokenName,
      holdingsAmount,
      holdingsUsd,
      boughtAmount,
      boughtUsd,
      soldAmount,
      soldUsd,
      pnlUsd,
    });
  }
  return rows;
}

const DUMMY_TOKENS: SpotMarketToken[] = [
  {
    tokenAddress: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    symbol: 'SOL',
    logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    volume24hUsd: 224_400_000,
    priceUsd: 151.23,
    marketCapUsd: 68_000_000_000,
    change24hPercent: 2.35,
    markPriceUsd: 151.2,
    fdvUsd: 70_000_000_000,
    liquidityUsd: 1_000_000_000,
    circulatingSupply: 450_000_000,
    totalSupply: 560_000_000,
    percentChange24h: 2.35,
    buys24hUsd: 120_000_000,
    sells24hUsd: -104_400_000,
  },
  {
    tokenAddress: 'FARTxLVqm9ezNvQ8V4E8w9FVBYRHGpJzp2cXm7pump',
    name: 'Fartcoin',
    symbol: 'FARTCOIN',
    logoUrl: 'https://cryptologos.cc/logos/fartcoin-fart-logo.png',
    volume24hUsd: 124_300_000,
    priceUsd: 1.53,
    marketCapUsd: 1_530_000_000,
    change24hPercent: 12.35,
    markPriceUsd: 1.54,
    fdvUsd: 1_600_000_000,
    liquidityUsd: 30_000_000,
    circulatingSupply: 1_000_000_000,
    totalSupply: 1_600_000_000,
    percentChange24h: 12.35,
    buys24hUsd: 70_000_000,
    sells24hUsd: -54_300_000,
  },
  {
    tokenAddress: 'WIFgzYxgkMtFGzGYAzm72rnWC9eFsEhSUvBdtpump',
    name: 'dogwifhat',
    symbol: 'WIF',
    logoUrl: 'https://cryptologos.cc/logos/dogwifhat-wif-logo.png',
    volume24hUsd: 111_200_000,
    priceUsd: 0.652,
    marketCapUsd: 290_000_000,
    change24hPercent: -3.35,
    markPriceUsd: 0.651,
    fdvUsd: 300_000_000,
    liquidityUsd: 20_000_000,
    circulatingSupply: 445_000_000,
    totalSupply: 460_000_000,
    percentChange24h: -3.35,
    buys24hUsd: 50_000_000,
    sells24hUsd: -61_200_000,
  },
  {
    tokenAddress: 'BONKxYxgkMtFGzGYAzm72rnWC9eFsEhSUvBdtbonk',
    name: 'Bonk',
    symbol: 'BONK',
    logoUrl: 'https://cryptologos.cc/logos/bonk-bonk-logo.png',
    volume24hUsd: 80_000_000,
    priceUsd: 0.000025,
    marketCapUsd: 1_500_000_000,
    change24hPercent: 8.5,
    markPriceUsd: 0.0000251,
    fdvUsd: 2_000_000_000,
    liquidityUsd: 10_000_000,
    circulatingSupply: 60_000_000_000_000,
    totalSupply: 100_000_000_000_000,
    percentChange24h: 8.5,
    buys24hUsd: 45_000_000,
    sells24hUsd: -35_000_000,
  },
];

// TODO: spot localization

const SpotPage = () => {
  const { symbol } = useParams<{ symbol: string }>();

  const tradeLayout = useAppSelector(getSelectedTradeLayout);

  const [isHorizontalOpen, setIsHorizontalOpen] = useState(true);

  const dummyHoldings: SpotHoldingRow[] = useMemo(() => generateDummyHoldings(50), []);

  const handleTokenSelect = () => {
    // Navigate
  };

  const handlePositionSelect = () => {
    // Navigate
  };

  const handleTokenSearchChange = () => {
    // Query search API
  };

  const handlePositionSell = () => {
    // Sell dialog or navigate
  };

  useCurrentSpotToken();

  return (
    <$SpotLayout tradeLayout={tradeLayout} isHorizontalOpen={isHorizontalOpen}>
      <header tw="[grid-area:Top]">
        <SpotHeader
          currentToken={DUMMY_TOKENS[1]!}
          searchResults={DUMMY_TOKENS}
          onTokenSelect={handleTokenSelect}
          onSearchTextChange={handleTokenSearchChange}
        />
      </header>

      <$GridSection gridArea="Side">
        <SpotTradeForm />
        <SpotTokenInfo
          links={[
            { icon: IconName.Earth, url: '' },
            { icon: IconName.File, url: '' },
            { icon: IconName.CoinMarketCap, url: '' },
            { icon: IconName.SocialX, url: '' },
          ]}
          contractAddress="WIFgzYxgkMtFGzGYAzm72rnWC9eFsEhSUvBdtpump"
          createdAt={Date.now() - 21 * 24 * 60 * 60 * 1000}
          items={[
            {
              key: 'holders',
              iconName: IconName.UserGroup,
              label: 'Holders',
              value: <Output type={OutputType.CompactNumber} value={123123} />,
            },
            {
              key: 'top10',
              iconName: IconName.User2,
              label: 'Top 10',
              value: <Output type={OutputType.Percent} value={0.0424} />,
            },
            {
              key: 'devHolding',
              iconName: IconName.ChefHat,
              label: 'Dev Holding',
              value: <Output type={OutputType.Percent} value={0.0123} />,
            },
            {
              key: 'snipers',
              iconName: IconName.Scope,
              label: 'Snipers',
              value: <Output type={OutputType.Percent} value={0.0124} />,
            },
            {
              key: 'bundlers',
              iconName: IconName.Ghost,
              label: 'Bundlers',
              value: <Output type={OutputType.Percent} value={0.0424} />,
            },
            {
              key: 'insiders',
              iconName: IconName.Warning,
              label: 'Insiders',
              value: <Output type={OutputType.Percent} value={0.01} />,
            },
          ]}
        />
      </$GridSection>

      <$GridSection gridArea="Inner">
        <SpotTvChart symbol={symbol!} />
      </$GridSection>

      <$GridSection gridArea="Horizontal">
        <SpotHorizontalPanel
          data={dummyHoldings}
          isOpen={isHorizontalOpen}
          setIsOpen={setIsHorizontalOpen}
          onRowAction={handlePositionSelect}
          onSellAction={handlePositionSell}
        />
      </$GridSection>
    </$SpotLayout>
  );
};

export default SpotPage;

const $SpotLayout = styled.article<{
  tradeLayout: TradeLayouts;
  isHorizontalOpen: boolean;
}>`
  /* prettier-ignore */
  --layout-default: 
    'Top Top' auto 
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' 300px
    / 1fr 400px;

  /* prettier-ignore */
  --layout-default-desktopMedium:
    'Top Side' auto
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' 300px
    / 1fr 400px;

  --layout: var(--layout-default);

  @media ${breakpoints.desktopMedium} {
    --layout: var(--layout-default-desktopMedium);
  }

  ${({ tradeLayout }) =>
    ({
      [TradeLayouts.Default]: null,
      [TradeLayouts.Reverse]: css`
        direction: rtl;
        > * {
          direction: initial;
        }
      `,
    })[tradeLayout]}

  ${({ isHorizontalOpen }) =>
    !isHorizontalOpen &&
    css`
      --layout-default: 'Top Top' auto 'Inner Side' minmax(0, 1fr) 'Horizontal Side'
        var(--tabs-height) / 1fr 400px;

      --layout-default-desktopMedium: 'Top Side' auto 'Inner Side' minmax(0, 1fr) 'Horizontal Side'
        var(--tabs-height) / 1fr 400px;
    `}

  width: 0;
  min-width: 100%;
  height: 0;
  min-height: 100%;

  display: grid;
  grid-template: var(--layout);

  ${layoutMixins.withOuterAndInnerBorders}

  @media (prefers-reduced-motion: no-preference) {
    transition: grid-template 0.2s var(--ease-out-expo);
  }

  > * {
    display: flex;
    flex-direction: column;
  }

  > section {
    contain: strict;
  }
`;

const $GridSection = styled.section<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};
  ${layoutMixins.withOuterAndInnerBorders}
`;
