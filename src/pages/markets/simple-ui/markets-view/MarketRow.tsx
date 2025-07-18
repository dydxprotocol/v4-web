import { Link } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { MarketData } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';

export const MarketRow = ({ className, market }: { className?: string; market: MarketData }) => {
  const stringGetter = useStringGetter();

  const percentChangeColor = market.percentChange24h
    ? market.percentChange24h >= 0
      ? 'var(--color-positive)'
      : 'var(--color-negative)'
    : 'var(--color-text-1)';

  return (
    <Link
      className={className}
      tw="row cursor-pointer justify-between gap-0.5 px-1.25 hover:bg-color-layer-4"
      to={`${AppRoute.Trade}/${market.id}`}
    >
      <div tw="row min-w-0 flex-grow-0 gap-0.5">
        <AssetIcon logoUrl={market.logo} tw="size-[2.25rem] min-w-[2.25rem]" />
        <div tw="flexColumn gap-0.25">
          <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem]">
            {market.displayableAsset}
          </span>
          <Output
            tw="text-color-text-1 font-small-book"
            type={OutputType.CompactFiat}
            value={market.marketCap}
            slotLeft={
              <span tw="mr-0.25 text-color-text-0">
                {stringGetter({ key: STRING_KEYS.MARKET })}
              </span>
            }
          />
        </div>
      </div>

      <div tw="flex flex-col items-end gap-0.25 text-end">
        <Output
          tw="text-color-text-2"
          useGrouping
          withSubscript
          type={OutputType.Fiat}
          value={market.oraclePrice}
          fractionDigits={market.tickSizeDecimals}
        />
        <Output
          tw="font-small-book"
          css={{
            color: percentChangeColor,
          }}
          type={OutputType.Percent}
          value={market.percentChange24h}
        />
      </div>
    </Link>
  );
};
