import { CSSProperties } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import { MarketData } from '@/constants/markets';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';

const MarketRow = ({ market, style }: { market: MarketData; style: CSSProperties }) => {
  const stringGetter = useStringGetter();

  const percentChangeColor = market.percentChange24h
    ? market.percentChange24h >= 0
      ? 'var(--color-positive)'
      : 'var(--color-negative)'
    : 'var(--color-text-1)';

  return (
    <div
      style={style}
      tw="row cursor-pointer justify-between gap-0.5 border-[length:--border-width] border-l-0 border-r-0 border-t-0 border-solid border-color-border px-1.5 hover:bg-color-layer-4"
    >
      <div tw="row min-w-0 flex-grow-0 gap-0.5">
        <AssetIcon logoUrl={market.logo} tw="size-[2.25rem] min-w-[2.25rem]" />
        <div tw="flexColumn">
          <span tw="overflow-hidden text-ellipsis whitespace-nowrap">
            {market.displayableAsset}
          </span>
          <Output
            tw="text-color-text-2 font-mini-book"
            type={OutputType.CompactFiat}
            value={market.volume24h ?? market.spotVolume24h}
            slotLeft={
              <span tw="mr-0.5 text-color-text-0">{stringGetter({ key: STRING_KEYS.VOLUME })}</span>
            }
          />
        </div>
      </div>

      <div tw="flex flex-col items-end gap-0.25 text-end">
        <Output
          tw="text-color-text-2"
          withSubscript
          type={OutputType.Fiat}
          value={market.oraclePrice}
          fractionDigits={market.tickSizeDecimals}
        />
        <Output
          tw="font-mini-book"
          css={{
            color: percentChangeColor,
          }}
          type={OutputType.Percent}
          value={market.percentChange24h}
        />
      </div>
    </div>
  );
};

export default MarketRow;
