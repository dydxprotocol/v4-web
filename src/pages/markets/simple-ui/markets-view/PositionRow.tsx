import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import { Link } from 'react-router-dom';

import { AppRoute } from '@/constants/routes';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';

import { getIndexerPositionSideStringKey } from '@/lib/enumToStringKeyHelpers';

export const PositionRow = ({
  className,
  position,
}: {
  className?: string;
  position: SubaccountPosition;
}) => {
  const stringGetter = useStringGetter();
  const market = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    position.market
  );

  if (!market) return null;

  const percentChangeColor = market.percentChange24h
    ? market.percentChange24h >= 0
      ? 'var(--color-positive)'
      : 'var(--color-negative)'
    : 'var(--color-text-1)';

  const sideString = stringGetter({ key: getIndexerPositionSideStringKey(position.side) });

  const sideColor =
    position.side === IndexerPositionSide.LONG ? 'var(--color-positive)' : 'var(--color-negative)';

  return (
    <Link
      className={className}
      tw="row cursor-pointer justify-between gap-0.5 px-[1.25rem] hover:bg-color-layer-4"
      to={`${AppRoute.Trade}/${market.ticker}`}
    >
      <div tw="row min-w-0 flex-grow-0 gap-0.5">
        <AssetIcon logoUrl={market.logo} tw="size-[2.75rem] min-w-[2.75rem]" />
        <div tw="flexColumn gap-0.25">
          <span tw="whitespace-nowrap leading-[1rem]">
            <span tw="mr-0.25" css={{ color: sideColor }}>
              {sideString}
            </span>
            {market.displayableAsset}
          </span>
          <Output
            tw="text-color-text-1 font-mini-book"
            type={OutputType.Fiat}
            value={position.notional}
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
    </Link>
  );
};
