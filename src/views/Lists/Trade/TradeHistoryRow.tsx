import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountTrade, TradeAction } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';
import tw from 'twin.macro';

// import { STRING_KEYS } from '@/constants/localization';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';

// import { useStringGetter } from '@/hooks/useStringGetter';
import { AssetIcon } from '@/components/AssetIcon';
// import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { getAssetFromMarketId } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { orEmptyObj } from '@/lib/typeUtils';

import { DateContent } from '../DateContent';

// Maps TradeAction to a display label and color
function getActionDisplayInfo(
  action: TradeAction
  // stringGetter: ReturnType<typeof useStringGetter>
) {
  switch (action) {
    case TradeAction.OPEN_LONG:
      return { label: 'Open Long', color: 'var(--color-positive)' };
    case TradeAction.OPEN_SHORT:
      return { label: 'Open Short', color: 'var(--color-negative)' };
    case TradeAction.CLOSE_LONG:
      return { label: 'Close Long', color: 'var(--color-negative)' };
    case TradeAction.CLOSE_SHORT:
      return { label: 'Close Short', color: 'var(--color-positive)' };
    case TradeAction.PARTIAL_CLOSE_LONG:
      return { label: 'Partial Close Long', color: 'var(--color-negative)' };
    case TradeAction.PARTIAL_CLOSE_SHORT:
      return { label: 'Partial Close Short', color: 'var(--color-positive)' };
    case TradeAction.ADD_TO_LONG:
      return { label: 'Add to Long', color: 'var(--color-positive)' };
    case TradeAction.ADD_TO_SHORT:
      return { label: 'Add to Short', color: 'var(--color-negative)' };
    default:
      return { label: 'Open Long', color: 'var(--color-positive)' };
  }
}

export const TradeHistoryRow = ({
  className,
  trade,
}: {
  className?: string;
  trade: SubaccountTrade;
}) => {
  // const stringGetter = useStringGetter();
  const { market, side, action, price, size, closedPnl, createdAt } = trade;

  const marketData = useAppSelectorWithArgs(BonsaiHelpers.markets.selectMarketSummaryById, market);
  const assetInfo = useAppSelectorWithArgs(
    BonsaiHelpers.assets.selectAssetInfo,
    mapIfPresent(market, getAssetFromMarketId)
  );

  const { logo } = orEmptyObj(assetInfo);
  const { displayableAsset, stepSizeDecimals, tickSizeDecimals } = orEmptyObj(marketData);

  const { actionLabel, actionColor, sideColor } = useMemo(() => {
    const display = getActionDisplayInfo(action); // , stringGetter);
    return {
      actionLabel: display.label,
      actionColor: display.color,
      sideColor: side === IndexerOrderSide.BUY ? 'var(--color-positive)' : 'var(--color-negative)',
    };
  }, [action, side]);

  const miniIcon = (
    <span
      tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-2"
      css={{ backgroundColor: sideColor }}
    />
  );

  return (
    <$TradeHistoryRow className={className}>
      <div tw="row min-w-0 flex-grow-0 gap-0.5">
        <div tw="relative">
          <AssetIcon logoUrl={logo} tw="size-2 min-w-2" />
          {miniIcon}
        </div>
        <div tw="flexColumn">
          <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
            <span css={{ color: actionColor }}>{actionLabel}</span>{' '}
            <Output
              tw="inline"
              type={OutputType.Number}
              value={size}
              fractionDigits={stepSizeDecimals}
            />{' '}
            {displayableAsset}
          </span>
          <DateContent time={createdAt} />
        </div>
      </div>

      <div tw="row gap-1">
        <div tw="flex flex-col items-end text-end">
          {closedPnl != null ? (
            <Output
              tw="text-color-text-2 font-mini-book"
              type={OutputType.Fiat}
              value={closedPnl}
              showSign={closedPnl > 0 ? ShowSign.None : ShowSign.Negative}
              withSignedValueColor
            />
          ) : (
            <span tw="text-color-text-0 font-mini-book">--</span>
          )}

          <Output
            tw="inline text-color-text-2 font-small-book"
            withSubscript
            type={OutputType.Fiat}
            value={price}
            fractionDigits={tickSizeDecimals}
            slotLeft={<span>@ </span>}
          />
        </div>
      </div>
    </$TradeHistoryRow>
  );
};

const $TradeHistoryRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
