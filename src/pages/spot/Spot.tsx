import { useCallback, useEffect, useMemo, useState } from 'react';

import { SpotSellInputType, SpotSide } from '@/bonsai/forms/spot';
import { BonsaiCore } from '@/bonsai/ontology';
import { keyBy } from 'lodash';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { SpotWalletStatus } from '@/constants/account';
import {
  HORIZONTAL_PANEL_MAX_HEIGHT,
  HORIZONTAL_PANEL_MIN_HEIGHT,
  TradeLayouts,
} from '@/constants/layout';
import { AppRoute } from '@/constants/routes';
import { SPOT_DUST_USD_THRESHOLD } from '@/constants/spot';

import { useCurrentSpotToken } from '@/hooks/useCurrentSpotToken';
import { useSpotTokenSearch } from '@/hooks/useSpotTokenSearch';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { SpotTvChart } from '@/views/charts/TradingView/SpotTvChart';

import { calculateSpotWalletStatus } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setHorizontalPanelHeightPx } from '@/state/appUiConfigs';
import { getHorizontalPanelHeightPx } from '@/state/appUiConfigsSelectors';
import { getSelectedTradeLayout } from '@/state/layoutSelectors';
import { spotFormActions } from '@/state/spotForm';

import { mapIfPresent } from '@/lib/do';
import { MustNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { useResizablePanel } from '../trade/useResizablePanel';
import { SpotHeader } from './SpotHeader';
import { type SpotPositionItem } from './SpotHoldingsTable';
import { SpotHorizontalPanel } from './SpotHorizontalPanel';
import { SpotTokenInfo, TokenInfoItem, TokenInfoLink } from './SpotTokenInfo';
import { SpotTradeForm } from './SpotTradeForm';
import { type SpotTradeItem } from './SpotTradesTable';
import { SpotHeaderToken } from './types';

// TODO: spot localization

const SpotPage = () => {
  const { currentSpotToken: tokenMint } = useCurrentSpotToken();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const tradeLayout = useAppSelector(getSelectedTradeLayout);

  const tokenMetadata = useAppSelector(BonsaiCore.spot.tokenMetadata.data);
  const tokenPrice = useAppSelector(BonsaiCore.spot.tokenPrice.data);
  const tokenBalances = useAppSelector(BonsaiCore.spot.walletPositions.tokenBalances);
  const walletPositions = useAppSelector(BonsaiCore.spot.walletPositions.positions);
  const portfolioTrades = useAppSelector(BonsaiCore.spot.portfolioTrades.data);
  const walletStatus = useAppSelector(calculateSpotWalletStatus);

  const canLoadSpotData = walletStatus === SpotWalletStatus.Connected;
  const isTokenMetadataLoading =
    useAppSelector(BonsaiCore.spot.tokenMetadata.loading) !== 'success';
  const isWalletPositionsLoading =
    useAppSelector(BonsaiCore.spot.walletPositions.loading) !== 'success' && canLoadSpotData;
  const isPortfolioTradesLoading =
    useAppSelector(BonsaiCore.spot.portfolioTrades.loading) !== 'success' && canLoadSpotData;

  const horizontalPanelHeightPxBase = useAppSelector(getHorizontalPanelHeightPx);
  const setPanelHeight = useCallback(
    (h: number) => {
      dispatch(setHorizontalPanelHeightPx(h));
    },
    [dispatch]
  );
  const [isHorizontalOpen, setIsHorizontalOpen] = useState(true);
  const {
    handleMouseDown,
    panelHeight: horizontalPanelHeight,
    isDragging,
  } = useResizablePanel(horizontalPanelHeightPxBase, setPanelHeight, {
    min: HORIZONTAL_PANEL_MIN_HEIGHT,
    max: HORIZONTAL_PANEL_MAX_HEIGHT,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: searchResults, isPending: isSearchLoading } = useSpotTokenSearch(searchQuery);

  const holdings: SpotPositionItem[] = useMemo(() => {
    const positionsByMint = keyBy(walletPositions, 'tokenMint');

    const res: SpotPositionItem[] = tokenBalances
      .map((tokenBalance) => {
        const position = positionsByMint[tokenBalance.mint];

        return {
          holdingsAmount: tokenBalance.amount,
          holdingsUsd: tokenBalance.usdValue,
          tokenAddress: tokenBalance.mint,
          tokenName: position?.tokenData?.tokenNameFull ?? position?.tokenData?.symbol ?? 'Unknown',
          tokenSymbol: position?.tokenData?.symbol ?? 'Unknown',
          tokenImage: position?.tokenData?.image,
          boughtAmount: position?.totalBought,
          boughtUsd: position?.totalBoughtUsd,
          soldAmount: position?.totalSold,
          soldUsd: position?.totalSoldUsd,
          pnlUsd: position?.unrealizedPnL,
          avgEntryUsd: position?.averageCostBasis,
        };
      })
      .filter((holding) => holding.holdingsUsd >= SPOT_DUST_USD_THRESHOLD);

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
    if (!tokenMetadata || tokenPrice == null || !tokenMint) return null;

    return {
      name: tokenMetadata.tokenNameFull ?? tokenMetadata.symbol ?? 'Unknown',
      symbol: tokenMetadata.symbol ?? 'Unknown',
      tokenAddress: tokenMint,
      buys24hUsd: tokenMetadata.token24hBuys,
      sells24hUsd: -MustNumber(tokenMetadata.token24hSells),
      change24hPercent: tokenMetadata.pricePercentChange24h,
      circulatingSupply: MustNumber(tokenMetadata.circulatingSupply),
      liquidityUsd: tokenMetadata.liquidityUSD,
      logoUrl: tokenMetadata.image,
      marketCapUsd: MustNumber(tokenMetadata.circulatingSupply) * tokenPrice,
      fdvUsd: MustNumber(tokenMetadata.totalSupply) * tokenPrice,
      priceUsd: tokenPrice,
      totalSupply: MustNumber(tokenMetadata.totalSupply),
      volume24hUsd: tokenMetadata.volumeUSD,
      holders: tokenMetadata.holders,
      top10HoldersPercent: mapIfPresent(tokenMetadata.top10HoldersPercent, (v) => v / 100),
      devHoldingPercent: mapIfPresent(tokenMetadata.devHoldingPercent, (v) => v / 100),
      snipersPercent: mapIfPresent(tokenMetadata.snipersPercent, (v) => v / 100),
      bundlersPercent: mapIfPresent(tokenMetadata.bundlersPercent, (v) => v / 100),
      insidersPercent: mapIfPresent(tokenMetadata.insidersPercent, (v) => v / 100),
      createdAt: mapIfPresent(tokenMetadata.createdAt, (v) => new Date(v * 1000)),
    };
  }, [tokenMint, tokenMetadata, tokenPrice]);

  const tokenLinks = useMemo(() => {
    const { socialLinks } = tokenMetadata ?? {};

    const links: TokenInfoLink[] = [
      { icon: IconName.Earth, url: socialLinks?.website },
      { icon: IconName.CoinMarketCap, url: socialLinks?.coinmarketcap },
      { icon: IconName.SocialX, url: socialLinks?.twitter },
    ].filter((v): v is TokenInfoLink => isPresent(v.url));

    return links;
  }, [tokenMetadata]);

  const tokenInfoItems: TokenInfoItem[] = useMemo(
    () => [
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
        value: <$Output type={OutputType.Percent} value={currentTokenData?.top10HoldersPercent} />,
      },
      {
        key: 'devHolding',
        iconName: IconName.ChefHat,
        label: 'Dev Holding',
        value: <$Output type={OutputType.Percent} value={currentTokenData?.devHoldingPercent} />,
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
        value: <$Output type={OutputType.Percent} value={currentTokenData?.bundlersPercent} />,
      },
      {
        key: 'insiders',
        iconName: IconName.Warning,
        label: 'Insiders',
        value: <$Output type={OutputType.Percent} value={currentTokenData?.insidersPercent} />,
      },
    ],
    [
      currentTokenData?.bundlersPercent,
      currentTokenData?.devHoldingPercent,
      currentTokenData?.holders,
      currentTokenData?.insidersPercent,
      currentTokenData?.snipersPercent,
      currentTokenData?.top10HoldersPercent,
    ]
  );

  const handleTokenSelect = (token: SpotHeaderToken) => {
    navigate(`${AppRoute.Spot}/${token.tokenAddress}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handlePositionSelect = (token: SpotPositionItem) => {
    navigate(`${AppRoute.Spot}/${token.tokenAddress}`);
  };

  const handleTokenSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handlePositionSell = (token: SpotPositionItem) => {
    dispatch(spotFormActions.setSide(SpotSide.SELL));
    dispatch(spotFormActions.setSellInputType(SpotSellInputType.PERCENT));
    dispatch(spotFormActions.setSize('100'));
    navigate(`${AppRoute.Spot}/${token.tokenAddress}`);
  };

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  return (
    <$SpotLayout
      tradeLayout={tradeLayout}
      isHorizontalOpen={isHorizontalOpen}
      horizontalPanelHeightPx={horizontalPanelHeight}
    >
      <header tw="[grid-area:Top]">
        <SpotHeader
          currentToken={currentTokenData}
          searchResults={searchResults}
          isSearchLoading={isSearchLoading}
          isTokenLoading={isTokenMetadataLoading}
          onTokenSelect={handleTokenSelect}
          onSearchTextChange={handleTokenSearchChange}
          isDropDownOpen={isSearchOpen}
          onDropDownChange={setIsSearchOpen}
          searchValue={searchQuery}
        />
      </header>

      <$SideGridSection gridArea="Side">
        <SpotTradeForm />
        <SpotTokenInfo
          isLoading={isTokenMetadataLoading}
          links={tokenLinks}
          contractAddress={tokenMint}
          createdAt={currentTokenData?.createdAt}
          items={tokenInfoItems}
        />
      </$SideGridSection>

      <$GridSection gridArea="Inner">
        <SpotTvChart tokenMint={tokenMint} />
        {isDragging && <$CoverUpTradingView />}
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
          handleStartResize={handleMouseDown}
        />
      </$GridSection>
    </$SpotLayout>
  );
};

export default SpotPage;

const $SpotLayout = styled.article<{
  tradeLayout: TradeLayouts;
  isHorizontalOpen: boolean;
  horizontalPanelHeightPx: number;
}>`
  --horizontalPanel-height: ${({ horizontalPanelHeightPx }) => `${horizontalPanelHeightPx}px`};

  /* prettier-ignore */
  --layout-default: 
    'Top Top' auto 
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / 1fr var(--spot-sidebar-width);

  /* prettier-ignore */
  --layout-default-desktopMedium:
    'Top Side' auto
    'Inner Side' minmax(0, 1fr)
    'Horizontal Side' minmax(var(--tabs-height), var(--horizontalPanel-height))
    / 1fr var(--spot-sidebar-width);

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
      --horizontalPanel-height: auto !important;
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
`;

const $SideGridSection = styled($GridSection)`
  ${layoutMixins.withInnerHorizontalBorders}
`;

const $Output = styled(Output)`
  line-height: 1;
`;

const $CoverUpTradingView = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 2;
  background: rgba(0, 0, 0, 0.2);
`;
