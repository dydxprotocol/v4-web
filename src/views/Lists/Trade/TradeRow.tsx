import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountFill, SubaccountFillType } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { getAssetFromMarketId } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import {
  getIndexerFillTypeStringKey,
  getIndexerLiquidityStringKey,
  getIndexerOrderSideStringKey,
} from '@/lib/enumToStringKeyHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const TradeRow = ({ className, fill }: { className?: string; fill: SubaccountFill }) => {
  const stringGetter = useStringGetter();
  const { market, side, price, type, size, createdAt, liquidity } = fill;
  const marketData = useAppSelectorWithArgs(BonsaiHelpers.markets.selectMarketSummaryById, market);

  const assetInfo = useAppSelectorWithArgs(
    BonsaiHelpers.assets.selectAssetInfo,
    mapIfPresent(market, getAssetFromMarketId)
  );

  const { logo } = orEmptyObj(assetInfo);
  const { displayableAsset, stepSizeDecimals, tickSizeDecimals } = orEmptyObj(marketData);

  const { sideString, sideColor, typeString, notionalFill, isLiquidation, liquidityString } =
    useMemo(() => {
      const priceBN = MustBigNumber(price);
      const notionalFillBN = MustBigNumber(size).times(priceBN);

      return {
        sideString: stringGetter({ key: side ? getIndexerOrderSideStringKey(side) : '' }),
        sideColor:
          side === IndexerOrderSide.BUY ? 'var(--color-positive)' : 'var(--color-negative)',
        typeString: stringGetter({ key: type ? getIndexerFillTypeStringKey(type) : '' }),
        notionalFill: notionalFillBN.gt(0) ? notionalFillBN : undefined,
        liquidityString: stringGetter({
          key: liquidity ? getIndexerLiquidityStringKey(liquidity) : '',
        }),
        isLiquidation: type === SubaccountFillType.LIQUIDATED,
      };
    }, [side, type, price, size, liquidity, stringGetter]);

  const miniIcon = isLiquidation ? (
    <Icon
      tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-w-[0.875rem] rounded-[50%] text-color-layer-3"
      iconName={IconName.Liquidation}
    />
  ) : (
    <span
      tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-3"
      css={{
        backgroundColor: sideColor,
      }}
    />
  );

  // TODO: Localize
  const content = isLiquidation ? (
    <>
      <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
        <span>{stringGetter({ key: STRING_KEYS.LIQUIDATION })}</span>
      </span>

      <span tw="text-color-text-0 font-mini-book">
        Force Sell{' '}
        <span tw="text-color-text-1 font-mini-book">
          <Output
            tw="inline"
            type={OutputType.Number}
            value={size}
            fractionDigits={stepSizeDecimals}
          />{' '}
          <span>{displayableAsset}</span>
        </span>
      </span>
    </>
  ) : (
    <>
      <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
        <span css={{ color: sideColor }}>{sideString}</span>{' '}
        <Output
          tw="inline"
          type={OutputType.Number}
          value={size}
          fractionDigits={stepSizeDecimals}
        />{' '}
        {displayableAsset}
      </span>

      <span tw="text-color-text-1 font-mini-book">{typeString}</span>
    </>
  );

  return (
    <$TradeRow className={className}>
      <div tw="row min-w-0 flex-grow-0 gap-0.5">
        <div tw="relative">
          <AssetIcon logoUrl={logo} tw="size-2 min-w-2" />
          {miniIcon}
        </div>
        <div tw="flexColumn">{content}</div>
      </div>

      <div tw="row gap-1">
        <div tw="flex flex-col items-end text-end">
          <Output
            tw="inline font-mini-book"
            type={OutputType.Fiat}
            value={notionalFill}
            slotLeft={<span>{liquidityString} </span>}
          />
          <Output
            tw="inline text-color-text-2 font-small-book"
            withSubscript
            type={OutputType.Fiat}
            value={price}
            fractionDigits={tickSizeDecimals}
            slotLeft={<span>@ </span>}
          />
        </div>
        <span>
          <Output
            tw="text-color-text-0 font-mini-book"
            type={OutputType.RelativeTime}
            value={createdAt}
          />
        </span>
      </div>
    </$TradeRow>
  );
};

const $TradeRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
