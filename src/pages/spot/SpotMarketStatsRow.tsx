import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Details, type DetailsItem } from '@/components/Details';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { SpotHeaderToken } from './types';

type SpotMarketStatsRowProps = {
  stats: SpotHeaderToken;
};

// TODO: spot localization

export const SpotMarketStatsRow = ({ stats }: SpotMarketStatsRowProps) => {
  const items: DetailsItem[] = [
    {
      key: 'market-cap',
      label: 'Market Cap',
      value: <Output type={OutputType.CompactFiat} value={stats.marketCapUsd} />,
    },
    {
      key: 'price',
      label: 'Price',
      value: <Output type={OutputType.SmallFiat} value={stats.priceUsd} />,
    },
    {
      key: 'fdv',
      label: 'FDV',
      value: <Output type={OutputType.Text} value={stats.fdvUsd} />,
    },
    {
      key: 'liquidity',
      label: 'Liquidity',
      value: <Output type={OutputType.CompactFiat} value={stats.liquidityUsd} />,
    },
    {
      key: 'supply',
      label: 'Circulating/Total Supply',
      value: (
        <span tw="row">
          <Output type={OutputType.CompactNumber} value={stats.circulatingSupply} />/
          <Output type={OutputType.CompactNumber} value={stats.totalSupply} />
        </span>
      ),
    },
    {
      key: 'change',
      label: '% Change 24h',
      value: (
        <Output
          type={OutputType.Percent}
          value={stats.change24hPercent}
          showSign={ShowSign.Both}
          withPolarityColor
        />
      ),
    },
    {
      key: 'volume',
      label: 'Volume 24h',
      value: <Output type={OutputType.CompactFiat} value={stats.volume24hUsd} />,
    },
    {
      key: 'buys',
      label: 'Buys 24h',
      value: (
        <Output
          type={OutputType.CompactFiat}
          value={stats.buys24hUsd}
          withSubscript
          withPolarityColor
        />
      ),
    },
    {
      key: 'sells',
      label: 'Sells 24h',
      value: (
        <Output
          type={OutputType.CompactFiat}
          value={stats.sells24hUsd}
          withSubscript
          withPolarityColor
          showSign={ShowSign.None}
        />
      ),
    },
  ];

  return <$Details items={items} layout="rowColumns" withSeparators />;
};

const $Details = styled(Details)`
  ${layoutMixins.scrollArea}
  ${layoutMixins.row}
    isolation: isolate;
  font: var(--font-mini-book);
` as typeof Details;
