import { useMemo, useState } from 'react';

import { SpotSide } from '@/bonsai/forms/spot';
import { BonsaiCore } from '@/bonsai/ontology';
import { keyBy } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { TradeLayouts } from '@/constants/layout';

import { useCurrentSpotToken } from '@/hooks/useCurrentSpotToken';
import { useSpotTokenSearch } from '@/hooks/useSpotTokenSearch';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { SpotTvChart } from '@/views/charts/TradingView/SpotTvChart';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getSelectedTradeLayout } from '@/state/layoutSelectors';
import { spotFormActions } from '@/state/spotForm';

import { mapIfPresent } from '@/lib/do';
import { MustNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { SpotHeader } from './SpotHeader';
import { type SpotPositionItem } from './SpotHoldingsTable';
import { SpotHorizontalPanel } from './SpotHorizontalPanel';
import { SpotTokenInfo } from './SpotTokenInfo';
import { SpotTradeForm } from './SpotTradeForm';
import { type SpotTradeItem } from './SpotTradesTable';
import { SpotHeaderToken } from './types';

// TODO: spot localization

const SpotPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const tradeLayout = useAppSelector(getSelectedTradeLayout);

  const tokenMetadata = useAppSelector(BonsaiCore.spot.tokenMetadata.data);
  const tokenPrice = useAppSelector(BonsaiCore.spot.tokenPrice.data);
  const tokenBalances = useAppSelector(BonsaiCore.spot.walletPositions.tokenBalances);
  const walletPositions = useAppSelector(BonsaiCore.spot.walletPositions.positions);
  const portfolioTrades = useAppSelector(BonsaiCore.spot.portfolioTrades.data);

  const isTokenMetadataLoading =
    useAppSelector(BonsaiCore.spot.tokenMetadata.loading) === 'pending';
  const isWalletPositionsLoading =
    useAppSelector(BonsaiCore.spot.walletPositions.loading) === 'pending';
  const isPortfolioTradesLoading =
    useAppSelector(BonsaiCore.spot.portfolioTrades.loading) === 'pending';

  const [isHorizontalOpen, setIsHorizontalOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isPending: isSearchLoading } = useSpotTokenSearch(searchQuery);

  useCurrentSpotToken();

  const holdings: SpotPositionItem[] = useMemo(() => {
    const positionsByMint = keyBy(walletPositions, 'tokenMint');

    const res: SpotPositionItem[] = tokenBalances
      .map((tokenBalance) => {
        const position = positionsByMint[tokenBalance.mint];
        if (!position) return null;
        return {
          tokenAddress: position.tokenMint,
          tokenName: position.tokenData.tokenNameFull,
          tokenSymbol: position.tokenData.symbol,
          tokenImage: position.tokenData.image,
          holdingsAmount: tokenBalance.amount,
          holdingsUsd: tokenBalance.usdValue,
          boughtAmount: position.totalBought,
          boughtUsd: position.totalBoughtUsd,
          soldAmount: position.totalSold,
          soldUsd: position.totalSoldUsd,
          pnlUsd: position.unrealizedPnL,
        };
      })
      .filter(isPresent);

    return res;
  }, [tokenBalances, walletPositions]);

  const trades: SpotTradeItem[] = useMemo(() => {
    return portfolioTrades.trades.map((trade) => {
      const tokenData = portfolioTrades.tokenData[trade.tokenMint];

      return {
        id: trade.id,
        side: trade.side,
        tokenAmount: trade.tokenAmount,
        usdValue: trade.usdValue,
        txHash: trade.txHash,
        createdAt: trade.createdAt,
        tokenSymbol: tokenData?.symbol,
        tokenImage: tokenData?.image,
        marketCapUsd: mapIfPresent(
          tokenData?.circulatingSupply,
          (circulatingSupply) => MustNumber(circulatingSupply) * trade.tokenPriceUsd
        ),
      };
    });
  }, [portfolioTrades]);

  const currentTokenData = useMemo<SpotHeaderToken | null>(() => {
    if (!tokenMetadata || tokenPrice == null) return null;

    return {
      name: tokenMetadata.tokenNameFull,
      symbol: tokenMetadata.symbol,
      tokenAddress: tokenMetadata.tokenMint,
      buys24hUsd: tokenMetadata.token24hBuys,
      sells24hUsd: -tokenMetadata.token24hSells,
      change24hPercent: tokenMetadata.pricePercentChange24h,
      circulatingSupply: +tokenMetadata.circulatingSupply,
      liquidityUsd: tokenMetadata.liquidityUSD,
      logoUrl: tokenMetadata.image,
      marketCapUsd: +tokenMetadata.circulatingSupply * tokenPrice,
      fdvUsd: +tokenMetadata.totalSupply * tokenPrice,
      priceUsd: tokenPrice,
      totalSupply: +tokenMetadata.totalSupply,
      volume24hUsd: tokenMetadata.volumeUSD,
      holders: tokenMetadata.holders,
      top10HoldersPercent: mapIfPresent(tokenMetadata.top10HoldersPercent, (v) => v / 100),
      devHoldingPercent: mapIfPresent(tokenMetadata.devHoldingPercent, (v) => v / 100),
      snipersPercent: mapIfPresent(tokenMetadata.snipersPercent, (v) => v / 100),
      bundlersPercent: mapIfPresent(tokenMetadata.bundlersPercent, (v) => v / 100),
      insidersPercent: mapIfPresent(tokenMetadata.insidersPercent, (v) => v / 100),
    };
  }, [tokenMetadata, tokenPrice]);

  const handleTokenSelect = (token: SpotHeaderToken) => {
    navigate(`/spot/${token.tokenAddress}`);
    setSearchQuery('');
  };

  const handlePositionSelect = (token: SpotPositionItem) => {
    navigate(`/spot/${token.tokenAddress}`);
  };

  const handleTokenSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handlePositionSell = (token: SpotPositionItem) => {
    dispatch(spotFormActions.setSide(SpotSide.SELL));
    navigate(`/spot/${token.tokenAddress}`);
  };

  return (
    <$SpotLayout tradeLayout={tradeLayout} isHorizontalOpen={isHorizontalOpen}>
      <header tw="[grid-area:Top]">
        <SpotHeader
          currentToken={currentTokenData}
          searchResults={searchResults}
          isSearchLoading={isSearchLoading}
          isTokenLoading={isTokenMetadataLoading}
          onTokenSelect={handleTokenSelect}
          onSearchTextChange={handleTokenSearchChange}
        />
      </header>

      <$GridSection gridArea="Side">
        <SpotTradeForm />
        <SpotTokenInfo
          isLoading={isTokenMetadataLoading}
          links={[
            { icon: IconName.Earth, url: '1' },
            { icon: IconName.File, url: '2' },
            { icon: IconName.CoinMarketCap, url: '3' },
            { icon: IconName.SocialX, url: '4' },
          ]}
          contractAddress={symbol!}
          createdAt={Date.now() - 21 * 24 * 60 * 60 * 1000}
          items={[
            {
              key: 'holders',
              iconName: IconName.UserGroup,
              label: 'Holders',
              value: <$Output type={OutputType.CompactNumber} value={currentTokenData?.holders} />,
            },
            {
              key: 'top10',
              iconName: IconName.User2,
              label: 'Top 10',
              value: (
                <$Output type={OutputType.Percent} value={currentTokenData?.top10HoldersPercent} />
              ),
            },
            {
              key: 'devHolding',
              iconName: IconName.ChefHat,
              label: 'Dev Holding',
              value: (
                <$Output type={OutputType.Percent} value={currentTokenData?.devHoldingPercent} />
              ),
            },
            {
              key: 'snipers',
              iconName: IconName.Scope,
              label: 'Snipers',
              value: <$Output type={OutputType.Percent} value={currentTokenData?.snipersPercent} />,
            },
            {
              key: 'bundlers',
              iconName: IconName.Ghost,
              label: 'Bundlers',
              value: (
                <$Output type={OutputType.Percent} value={currentTokenData?.bundlersPercent} />
              ),
            },
            {
              key: 'insiders',
              iconName: IconName.Warning,
              label: 'Insiders',
              value: (
                <$Output type={OutputType.Percent} value={currentTokenData?.insidersPercent} />
              ),
            },
          ]}
        />
      </$GridSection>

      <$GridSection gridArea="Inner">
        <SpotTvChart symbol={symbol!} />
      </$GridSection>

      <$GridSection gridArea="Horizontal">
        <SpotHorizontalPanel
          isTradesLoading={isPortfolioTradesLoading}
          isHoldingsLoading={isWalletPositionsLoading}
          holdings={holdings}
          trades={trades}
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

const $Output = styled(Output)`
  line-height: 1;
`;
