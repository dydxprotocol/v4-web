import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountTrade } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';
import tw from 'twin.macro';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { getAssetFromMarketId } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { getOrderSideColor } from '@/lib/tradeHistoryHelpers';
import { orEmptyObj } from '@/lib/typeUtils';

import { DateContent } from '../DateContent';

export const TradeHistoryRow = ({
  className,
  trade,
}: {
  className?: string;
  trade: SubaccountTrade;
}) => {
  const stringGetter = useStringGetter();
  const { marketId, side, action, price, size, closedPnl, createdAt } = trade;

  const marketData = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    marketId
  );
  const assetInfo = useAppSelectorWithArgs(
    BonsaiHelpers.assets.selectAssetInfo,
    mapIfPresent(marketId, getAssetFromMarketId)
  );

  const { logo } = orEmptyObj(assetInfo);
  const { displayableAsset, stepSizeDecimals, tickSizeDecimals } = orEmptyObj(marketData);

  const { actionLabel, actionColor, sideColor } = useMemo(
    () => getOrderSideColor(action, side, stringGetter),
    [action, side, stringGetter]
  );

  const miniIcon = useMemo(
    () => (
      <span
        tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-2"
        css={{ backgroundColor: sideColor }}
      />
    ),
    [sideColor]
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
          {closedPnl != null && closedPnl !== 0 ? (
            <Output
              tw="text-color-text-2 font-mini-book"
              type={OutputType.Fiat}
              value={closedPnl}
              showSign={closedPnl >= 0 ? ShowSign.None : ShowSign.Negative}
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
