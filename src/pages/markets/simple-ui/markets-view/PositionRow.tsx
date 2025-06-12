import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import { Link } from 'react-router-dom';

import { AppRoute } from '@/constants/routes';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Tag } from '@/components/Tag';

import { getIndexerPositionSideStringKey } from '@/lib/enumToStringKeyHelpers';
import { MustBigNumber } from '@/lib/numbers';

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

  const pnlColor = position.updatedUnrealizedPnl.gt(0)
    ? 'var(--color-positive)'
    : position.updatedUnrealizedPnl.lt(0)
      ? 'var(--color-negative)'
      : 'var(--color-text-1)';

  const sideString = stringGetter({ key: getIndexerPositionSideStringKey(position.side) });

  const sideColor =
    position.side === IndexerPositionSide.LONG ? 'var(--color-positive)' : 'var(--color-negative)';

  const shouldCompact =
    market.stepSizeDecimals >= 0 && MustBigNumber(position.signedSize).abs().gte(100_000);

  return (
    <Link
      className={className}
      tw="row cursor-pointer justify-between gap-0.5 px-[1.25rem] hover:bg-color-layer-4"
      to={`${AppRoute.Trade}/${market.ticker}`}
    >
      <div tw="row min-w-0 flex-grow-0 gap-0.5">
        <div tw="row relative size-[2.75rem] min-w-[2.75rem] justify-center rounded-[50%]">
          <AssetIcon logoUrl={market.logo} tw="size-[2.75rem] min-w-[2.75rem]" />
          <TrendIcon positionSide={position.side} tw="absolute bottom-[-3px] right-[-4px]" />
        </div>
        <div tw="flexColumn gap-0.25">
          <span tw="row gap-0.25 whitespace-nowrap leading-[1rem]">
            {market.displayableAsset}
            <Tag tw="bg-color-layer-4">
              <Output
                type={OutputType.Multiple}
                value={position.leverage}
                tw="text-color-text-1"
                fractionDigits={0}
              />
            </Tag>
          </span>
          <span tw="row gap-0.25 font-small-book">
            <span css={{ color: sideColor }}>{sideString}</span>
            <Output
              tw="text-color-text-0"
              type={shouldCompact ? OutputType.CompactNumber : OutputType.Number}
              value={position.signedSize}
            />
          </span>
        </div>
      </div>

      <div tw="flex flex-col items-end gap-0.25 text-end">
        <Output
          tw="text-color-text-2"
          withSubscript
          type={OutputType.Fiat}
          value={position.notional}
        />
        <span
          tw="row gap-0.25 text-color-text-1 font-small-book"
          css={{
            color: pnlColor,
          }}
        >
          <Output
            showSign={ShowSign.Both}
            type={OutputType.Fiat}
            value={position.updatedUnrealizedPnl}
          />
          {position.updatedUnrealizedPnlPercent && (
            <Output
              type={OutputType.Percent}
              value={position.updatedUnrealizedPnlPercent}
              slotLeft="("
              slotRight=")"
            />
          )}
        </span>
      </div>
    </Link>
  );
};

const TrendIcon = ({
  className,
  positionSide,
}: {
  className?: string;
  positionSide: IndexerPositionSide;
}) => {
  return (
    <div
      className={className}
      tw="row size-1 min-w-1 justify-center rounded-[50%] border-2 border-solid border-color-layer-2 text-color-layer-2"
      css={{
        backgroundColor:
          positionSide === IndexerPositionSide.LONG
            ? 'var(--color-positive)'
            : 'var(--color-negative)',
      }}
    >
      <Icon
        iconName={
          positionSide === IndexerPositionSide.LONG ? IconName.TrendingUp : IconName.TrendingDown
        }
        css={{
          '--icon-size': '0.6rem',
        }}
      />
    </div>
  );
};
