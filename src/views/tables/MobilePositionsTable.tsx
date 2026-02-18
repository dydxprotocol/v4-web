import { forwardRef, useCallback, useMemo } from 'react';

import { MarginMode } from '@/bonsai/forms/trade/types';
import { BonsaiCore } from '@/bonsai/ontology';
import {
  PerpetualMarketSummary,
  SubaccountOrder,
  SubaccountPosition,
} from '@/bonsai/types/summaryTypes';
import { Trigger } from '@radix-ui/react-collapsible';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Collapsible } from '@/components/Collapsible';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { marginModeMatchesFilter, MarketTypeFilter } from '@/pages/trade/types';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSubaccountConditionalOrders } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import { getNumberSign, MaybeNumber } from '@/lib/numbers';
import { orEmptyRecord } from '@/lib/typeUtils';

import { PositionsTriggersCell } from './PositionsTable/PositionsTriggersCell';

export enum PositionsTableColumnKey {
  Details = 'Details',
  IndexEntry = 'IndexEntry',

  Market = 'Market',
  Leverage = 'Leverage',
  Type = 'Type',
  Size = 'Size',
  Value = 'Value',
  PnL = 'PnL',
  Margin = 'Margin',
  AverageOpen = 'AverageOpen',
  Oracle = 'Oracle',
  Liquidation = 'Liquidation',
  Triggers = 'Triggers',
  NetFunding = 'NetFunding',
  Actions = 'Actions',
}

type PositionTableRow = {
  marketSummary: PerpetualMarketSummary | undefined;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  stepSizeDecimals: number;
  tickSizeDecimals: number;
  oraclePrice: number | undefined;
} & SubaccountPosition;

type ElementProps = {
  currentRoute?: string;
  currentMarket?: string;
  marketTypeFilter?: MarketTypeFilter;
  onNavigate?: () => void;
  navigateToOrders: (market: string) => void;
};

export const MobilePositionsTable = forwardRef(
  (
    { currentRoute, currentMarket, marketTypeFilter, onNavigate, navigateToOrders }: ElementProps,
    _ref
  ) => {
    const stringGetter = useStringGetter();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isSlTpLimitOrdersEnabled } = useEnvFeatures();

    const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
    // todo this uses the old subaccount id for now
    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

    const openPositions =
      useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR;

    const positions = useMemo(() => {
      return openPositions.filter((position) => {
        const matchesMarket = currentMarket == null || position.market === currentMarket;
        const marginType = position.marginMode;
        const matchesType = marginModeMatchesFilter(marginType, marketTypeFilter);
        return matchesMarket && matchesType;
      });
    }, [currentMarket, marketTypeFilter, openPositions]);

    const tpslOrdersByPositionUniqueId = useAppSelectorWithArgs(
      getSubaccountConditionalOrders,
      isSlTpLimitOrdersEnabled
    );

    const positionsData = useMemo(
      () =>
        positions.map((position: SubaccountPosition): PositionTableRow => {
          const marketSummary = marketSummaries[position.market];
          return {
            marketSummary,
            stopLossOrders:
              tpslOrdersByPositionUniqueId[position.uniqueId]?.stopLossOrders ?? EMPTY_ARR,
            takeProfitOrders:
              tpslOrdersByPositionUniqueId[position.uniqueId]?.takeProfitOrders ?? EMPTY_ARR,
            stepSizeDecimals: marketSummary?.stepSizeDecimals ?? TOKEN_DECIMALS,
            tickSizeDecimals: marketSummary?.tickSizeDecimals ?? USD_DECIMALS,
            oraclePrice: MaybeNumber(marketSummary?.oraclePrice) ?? undefined,
            ...position,
          };
        }),
      [positions, tpslOrdersByPositionUniqueId, marketSummaries]
    );

    const navigateToMarket = useCallback(
      (market: string) => {
        if (!currentMarket) {
          navigate(`${AppRoute.Trade}/${market}`, {
            state: { from: currentRoute },
          });
          onNavigate?.();
        }
      },
      [currentMarket]
    );

    const onCloseButtonToggle = (marketId: string) => {
      dispatch(tradeFormActions.setMarketId(marketId));
      dispatch(tradeFormActions.setIsClosingPosition(true));
      navigate(`${AppRoute.TradeForm}/${marketId}`);
    };

    return (
      <div tw="w-full">
        {positionsData.length === 0 && (
          <div tw="flex w-full flex-col items-center pt-3">
            <Icon iconName={IconName.Positions} tw="text-[3em]" />
            <h4>{stringGetter({ key: STRING_KEYS.POSITIONS_EMPTY_STATE })}</h4>
          </div>
        )}
        {positionsData.length > 0 &&
          positionsData.map((position) => {
            const isLong = position.side === IndexerPositionSide.LONG;
            return (
              <div key={position.market} tw="w-full">
                <Collapsible
                  slotTrigger={
                    <div tw="flex flex-1 items-center justify-between px-1.5 pt-1 text-small">
                      <div
                        tw="flex flex-1 flex-col gap-0.25"
                        onClick={() => navigateToMarket(position.market)}
                      >
                        <div tw="flex flex-1 items-center gap-0.25">
                          <AssetIcon
                            logoUrl={position.marketSummary?.logo}
                            symbol={position.marketSummary?.assetId}
                            tw="inlineRow min-w-[unset] [--asset-icon-size:1rem]"
                          />
                          <div>{position.marketSummary?.displayableAsset}</div>
                          <div style={{ color: isLong ? '#0DB37B' : '#FF5C5C' }}>
                            {isLong ? 'Long' : 'Short'}
                          </div>
                        </div>
                        <div tw="flex items-center gap-0.25 text-color-text-0">
                          <div tw="font-semibold">
                            {position.marginMode === MarginMode.CROSS ? 'Cross' : 'Isolated'}
                          </div>
                          <div tw="rounded-0.5 border-solid border-color-layer-3 px-0.25 py-[3px] text-mini">
                            {Math.round(position.effectiveSelectedLeverage.toNumber())}x
                          </div>
                        </div>
                      </div>
                      <div tw="flex flex-[1.1] flex-col gap-0.25">
                        <div>
                          {position.unsignedSize.toNumber()}{' '}
                          {position.marketSummary?.displayableAsset}
                        </div>
                        <Output
                          withSubscript
                          type={OutputType.Fiat}
                          value={position.unsignedSize.toNumber() * (position.oraclePrice ?? 0)}
                          fractionDigits={position.tickSizeDecimals}
                          tw="text-color-text-0"
                        />
                      </div>
                      <div tw="flex flex-[0.6] flex-col gap-0.25">
                        <$OutputSigned
                          sign={getNumberSign(position.updatedUnrealizedPnl)}
                          type={OutputType.Fiat}
                          value={position.updatedUnrealizedPnl}
                          showSign={ShowSign.Negative}
                        />
                        <$OutputSigned
                          sign={getNumberSign(position.updatedUnrealizedPnlPercent)}
                          type={OutputType.Percent}
                          value={position.updatedUnrealizedPnlPercent}
                          showSign={ShowSign.Negative}
                          fractionDigits={0}
                          withParentheses
                        />
                      </div>
                    </div>
                  }
                  label={
                    <$Trigger>
                      <$TriggerIcon>
                        <Icon iconName={IconName.Caret} />
                      </$TriggerIcon>
                    </$Trigger>
                  }
                >
                  <div tw="flex flex-col gap-1 pl-1.5 pr-3">
                    <div tw="flex justify-between">
                      <div tw="flex flex-1 flex-col gap-0.125">
                        <span tw="text-small text-color-text-0">Entry Price</span>
                        <Output
                          withSubscript
                          type={OutputType.Fiat}
                          value={position.entryPrice}
                          fractionDigits={position.tickSizeDecimals}
                        />
                      </div>
                      <div tw="flex flex-[1.1] flex-col gap-0.125">
                        <span tw="text-small text-color-text-0">Mark Price</span>
                        <Output
                          withSubscript
                          type={OutputType.Fiat}
                          value={position.oraclePrice}
                          fractionDigits={position.tickSizeDecimals}
                        />
                      </div>
                      <div tw="flex flex-[0.6] flex-col gap-0.125">
                        <span tw="text-small text-color-text-0">Liq. Price</span>
                        <Output
                          withSubscript
                          type={OutputType.Fiat}
                          value={position.liquidationPrice}
                          fractionDigits={position.tickSizeDecimals}
                        />
                      </div>
                    </div>
                    <div tw="flex justify-between">
                      <div tw="flex flex-1 flex-col gap-0.125">
                        <span tw="text-small text-color-text-0">Funding</span>
                        <$OutputSigned
                          sign={getNumberSign(position.netFunding)}
                          type={OutputType.Fiat}
                          value={position.netFunding}
                          showSign={ShowSign.Negative}
                        />
                      </div>
                      <div tw="flex flex-[1.1] flex-col gap-0.125">
                        <$TriggersContainer tw="">TP/SL</$TriggersContainer>
                        <PositionsTriggersCell
                          marketId={position.market}
                          positionUniqueId={position.uniqueId}
                          assetId={position.assetId}
                          tickSizeDecimals={position.tickSizeDecimals}
                          liquidationPrice={position.liquidationPrice}
                          stopLossOrders={position.stopLossOrders}
                          takeProfitOrders={position.takeProfitOrders}
                          positionSide={position.side}
                          positionSize={position.signedSize}
                          isDisabled={isAccountViewOnly}
                          onViewOrdersClick={navigateToOrders}
                        />
                      </div>
                      <div tw="flex flex-[0.6] flex-col gap-0.125">
                        <Button
                          tw="h-2 rounded-[8px] border-none bg-color-border-red px-1 text-mini text-red"
                          onClick={() => onCloseButtonToggle(position.market)}
                        >
                          <Icon iconName={IconName.Close} size="0.75rem" />
                          {stringGetter({ key: STRING_KEYS.CLOSE })}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Collapsible>
              </div>
            );
          })}
      </div>
    );
  }
);

const $OutputSigned = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    })[sign]};
`;

const $TriggersContainer = styled.div`
  font: var(--font-small-book);
  color: var(--tableStickyRow-textColor, var(--color-text-0));
`;

const $Trigger = styled(Trigger)`
  --trigger-textColor: inherit;
  --trigger-icon-width: 0.75em;
  --trigger-icon-color: inherit;
  --icon-size: var(--trigger-icon-width);
  padding-right: 16px;
`;

const $TriggerIcon = styled.span`
  display: inline-flex;
  transition: rotate 0.3s var(--ease-out-expo);
  color: var(--trigger-icon-color);

  ${$Trigger}[data-state='open'] & {
    rotate: -0.5turn;
  }
`;
