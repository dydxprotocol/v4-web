import { BonsaiHelpers } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';

import { AbacusPositionSide, type Nullable } from '@/constants/abacus';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, USD_DECIMALS } from '@/constants/numbers';
import { TooltipStringKeys } from '@/constants/tooltips';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DetachedScrollableSection, DetachedSection } from '@/components/ContentSection';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ToggleButton } from '@/components/ToggleButton';

import { calculateIsAccountLoading } from '@/state/accountCalculators';
import {
  getCurrentMarketPositionData,
  getCurrentMarketPositionDataForPostTrade,
} from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialogInTradeBox, openDialog, openDialogInTradeBox } from '@/state/dialogs';
import { getActiveTradeBoxDialog } from '@/state/dialogsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { BIG_NUMBERS, isNumber, MustBigNumber } from '@/lib/numbers';
import { hasPositionSideChanged } from '@/lib/tradeData';
import { orEmptyObj } from '@/lib/typeUtils';

import { PositionTile } from './PositionTile';

type PositionInfoItems = {
  // Key/Type
  key: string;
  type: OutputType;

  // Label Properties
  label: string;
  tooltip?: TooltipStringKeys;
  tooltipParams?: Record<string, string>;

  // Output/DiffOutput Properties
  fractionDigits?: number | null;
  hasInvalidNewValue?: boolean;
  sign?: NumberSign;
  showSign?: ShowSign;
  useDiffOutput?: boolean;
  withBaseFont?: boolean;
  withSubscript?: boolean;

  // Values
  value: Nullable<number | BigNumber> | string;
  newValue?: Nullable<number | BigNumber> | string;
  percentValue?: Nullable<number | BigNumber> | string;
};

export const PositionInfo = ({ showNarrowVariation }: { showNarrowVariation?: boolean }) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const dispatch = useAppDispatch();

  const {
    stepSizeDecimals,
    tickSizeDecimals,
    assetId: id,
    logo: imageUrl,
  } = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo));
  const activeTradeBoxDialog = useAppSelector(getActiveTradeBoxDialog);
  const currentMarketPosition = orEmptyObj(useAppSelector(getCurrentMarketPositionData));
  const currentMarketPositionPostTrade = orEmptyObj(
    useAppSelector(getCurrentMarketPositionDataForPostTrade)
  );
  const isLoading = useAppSelector(calculateIsAccountLoading);

  const symbol = getDisplayableAssetFromBaseAsset(id);

  const {
    entryPrice,
    exitPrice,
    leverage,
    liquidationPrice,
    netFunding,
    realizedPnl,
    notional: notionalTotal,
    signedSize: size,
    updatedUnrealizedPnl: unrealizedPnl,
    updatedUnrealizedPnlPercent: unrealizedPnlPercent,
  } = currentMarketPosition;

  const netFundingBN = MustBigNumber(netFunding);

  const detailFieldsContent: PositionInfoItems[] = [
    {
      key: 'average-open',
      type: OutputType.Fiat,
      label: STRING_KEYS.AVERAGE_OPEN,
      fractionDigits: tickSizeDecimals,
      value: entryPrice,
      withSubscript: true,
    },
    {
      key: 'average-close',
      type: OutputType.Fiat,
      label: STRING_KEYS.AVERAGE_CLOSE,
      fractionDigits: tickSizeDecimals,
      value: exitPrice,
    },
    {
      key: 'net-funding',
      type: OutputType.Fiat,
      label: STRING_KEYS.NET_FUNDING,
      tooltip: 'net-funding',
      sign: MustBigNumber(netFunding).gt(0)
        ? NumberSign.Positive
        : MustBigNumber(netFunding).lt(0)
          ? NumberSign.Negative
          : NumberSign.Neutral,
      value: netFunding && netFundingBN.toFixed(USD_DECIMALS),
    },
  ];

  const currentSize = size;
  const postOrderSize = currentMarketPositionPostTrade.size?.postOrder;
  const leverageBN = MustBigNumber(leverage);
  const newLeverageBN = MustBigNumber(currentMarketPositionPostTrade.leverage?.postOrder);
  const maxLeverage = BIG_NUMBERS.ONE.div(
    MustBigNumber(currentMarketPositionPostTrade.adjustedImf?.postOrder)
  );
  const newPositionIsClosed = MustBigNumber(postOrderSize).isZero();
  const hasNoPositionInMarket = MustBigNumber(currentSize).isZero();

  const newLeverageIsInvalid =
    !!currentMarketPositionPostTrade.leverage?.postOrder &&
    (!newLeverageBN.isFinite() || newLeverageBN.gt(maxLeverage));

  const newLeverageIsLarger =
    !leverage ||
    (currentMarketPositionPostTrade.leverage?.postOrder && newLeverageBN.gt(leverageBN));

  let liquidationArrowSign = NumberSign.Neutral;
  const newLiquidationPriceIsLarger = MustBigNumber(
    currentMarketPositionPostTrade.liquidationPrice?.postOrder
  ).gt(MustBigNumber(liquidationPrice));

  const positionSideHasChanged = hasPositionSideChanged({
    currentSize: currentSize?.toNumber(),
    postOrderSize,
  }).positionSideHasChanged;

  if (currentMarketPositionPostTrade.leverage?.postOrder) {
    if (newLeverageIsInvalid) {
      liquidationArrowSign = NumberSign.Negative;
    } else if (newPositionIsClosed) {
      liquidationArrowSign = NumberSign.Positive;
    } else if (positionSideHasChanged) {
      liquidationArrowSign = NumberSign.Neutral;
    } else if (
      liquidationPrice && MustBigNumber(currentSize).gt(0)
        ? !newLiquidationPriceIsLarger
        : newLiquidationPriceIsLarger
    ) {
      liquidationArrowSign = NumberSign.Positive;
    } else if (
      !liquidationPrice ||
      (!newPositionIsClosed && MustBigNumber(currentSize).gt(0)
        ? newLiquidationPriceIsLarger
        : !newLiquidationPriceIsLarger)
    ) {
      liquidationArrowSign = NumberSign.Negative;
    }
  }

  const mainFieldsContent = [
    {
      key: 'leverage',
      type: OutputType.Multiple,
      label: STRING_KEYS.LEVERAGE,
      tooltip: 'leverage',
      hasInvalidNewValue: Boolean(newLeverageIsInvalid),
      sign:
        !newLeverageIsInvalid && !newLeverageIsLarger
          ? NumberSign.Positive
          : newLeverageIsInvalid || newLeverageIsLarger
            ? NumberSign.Negative
            : NumberSign.Neutral,
      useDiffOutput: true,
      showSign: ShowSign.None,
      value: leverage,
      newValue: currentMarketPositionPostTrade.leverage?.postOrder,
      withBaseFont: true,
    },
    {
      key: 'liquidation-price',
      type: OutputType.Fiat,
      label: STRING_KEYS.LIQUIDATION_PRICE,
      tooltip:
        currentMarketPositionPostTrade.side?.postOrder === AbacusPositionSide.SHORT
          ? 'liquidation-price-short'
          : 'liquidation-price-long',
      tooltipParams: {
        SYMBOL: symbol,
      },
      fractionDigits: tickSizeDecimals,
      hasInvalidNewValue: Boolean(newLeverageIsInvalid),
      sign: liquidationArrowSign,
      useDiffOutput: true,
      value: liquidationPrice,
      newValue: currentMarketPositionPostTrade.liquidationPrice?.postOrder,
      withBaseFont: true,
    },
    {
      key: 'unrealized-pnl',
      type: OutputType.Fiat,
      label: STRING_KEYS.UNREALIZED_PNL,
      tooltip: 'unrealized-pnl',
      sign: MustBigNumber(unrealizedPnl).gt(0)
        ? NumberSign.Positive
        : MustBigNumber(unrealizedPnl).lt(0)
          ? NumberSign.Negative
          : NumberSign.Neutral,
      value: unrealizedPnl,
      percentValue: unrealizedPnlPercent,
      withBaseFont: true,
    },
    {
      key: 'realized-pnl',
      type: OutputType.Fiat,
      label: STRING_KEYS.REALIZED_PNL,
      tooltip: 'realized-pnl',
      sign: MustBigNumber(realizedPnl).gt(0)
        ? NumberSign.Positive
        : MustBigNumber(realizedPnl).lt(0)
          ? NumberSign.Negative
          : NumberSign.Neutral,
      value: realizedPnl ?? undefined,
      withBaseFont: true,
    },
  ] as const satisfies readonly PositionInfoItems[];

  const createDetailItem = ({
    key,
    type,
    label,
    tooltip,
    tooltipParams,
    fractionDigits,
    hasInvalidNewValue,
    sign,
    showSign,
    useDiffOutput,
    value,
    newValue,
    percentValue,
    withBaseFont,
    withSubscript,
  }: PositionInfoItems) => ({
    key,
    label: stringGetter({ key: label }),
    tooltip,
    tooltipParams,
    value: useDiffOutput ? (
      <$DiffOutput
        type={type}
        value={value}
        newValue={newValue}
        fractionDigits={fractionDigits}
        hasInvalidNewValue={hasInvalidNewValue}
        layout={isTablet ? 'row' : 'column'}
        sign={sign}
        showSign={showSign}
        withBaseFont={withBaseFont}
        withSubscript={withSubscript}
        withDiff={isNumber(newValue) && value !== newValue}
      />
    ) : (
      <$Output
        type={type}
        value={value}
        fractionDigits={fractionDigits}
        showSign={showSign}
        sign={sign}
        slotRight={
          percentValue && (
            <$Output
              type={OutputType.Percent}
              value={percentValue}
              sign={sign}
              showSign={showSign}
              withParentheses
              withBaseFont={withBaseFont}
              margin="0 0 0 0.5ch"
            />
          )
        }
        withBaseFont={withBaseFont}
        withSubscript={withSubscript}
      />
    ),
  });

  const actions = (
    <$Actions>
      {isTablet ? (
        <$ClosePositionButton onClick={() => dispatch(openDialog(DialogTypes.ClosePosition()))}>
          {stringGetter({ key: STRING_KEYS.CLOSE_POSITION })}
        </$ClosePositionButton>
      ) : (
        <$ClosePositionToggleButton
          isPressed={
            activeTradeBoxDialog != null &&
            TradeBoxDialogTypes.is.ClosePosition(activeTradeBoxDialog)
          }
          onPressedChange={(isPressed: boolean) => {
            dispatch(
              isPressed
                ? openDialogInTradeBox(TradeBoxDialogTypes.ClosePosition())
                : closeDialogInTradeBox()
            );

            if (!isPressed)
              abacusStateManager.clearClosePositionInputValues({ shouldFocusOnTradeInput: true });
          }}
        >
          {stringGetter({ key: STRING_KEYS.CLOSE_POSITION })}
        </$ClosePositionToggleButton>
      )}
    </$Actions>
  );

  if (showNarrowVariation) {
    return (
      <$MobilePositionInfo>
        <$DetachedSection>
          <PositionTile
            assetImgUrl={imageUrl}
            currentSize={size?.toNumber()}
            notionalTotal={notionalTotal?.toNumber()}
            postOrderSize={currentMarketPositionPostTrade.size?.postOrder}
            stepSizeDecimals={stepSizeDecimals}
            symbol={id ?? undefined}
            tickSizeDecimals={tickSizeDecimals}
            showNarrowVariation={showNarrowVariation}
            isLoading={isLoading}
          />

          <$MobileDetails
            items={[mainFieldsContent[0], mainFieldsContent[1]].map(createDetailItem)}
            layout="stackColumn"
            withSeparators
            isLoading={isLoading}
          />
        </$DetachedSection>

        <$DetachedScrollableSection>
          <$MobileDetails
            items={[mainFieldsContent[2], mainFieldsContent[3]].map(createDetailItem)}
            layout="rowColumns"
            withSeparators
            isLoading={isLoading}
          />
        </$DetachedScrollableSection>

        {!hasNoPositionInMarket && <$DetachedSection>{actions}</$DetachedSection>}

        <$DetachedSection>
          <$MobileDetails
            items={detailFieldsContent.map(createDetailItem)}
            withSeparators
            isLoading={isLoading}
          />
        </$DetachedSection>
      </$MobilePositionInfo>
    );
  }

  return (
    <$PositionInfo>
      <div>
        <PositionTile
          assetImgUrl={imageUrl}
          currentSize={size?.toNumber()}
          notionalTotal={notionalTotal?.toNumber()}
          postOrderSize={currentMarketPositionPostTrade.size?.postOrder}
          stepSizeDecimals={stepSizeDecimals}
          symbol={id ?? undefined}
          tickSizeDecimals={tickSizeDecimals}
          isLoading={isLoading}
        />

        <$PrimaryDetails
          items={mainFieldsContent.map(createDetailItem)}
          justifyItems="end"
          layout="grid"
          withOverflow={false}
          isLoading={isLoading}
        />
      </div>

      <div>
        <Details
          items={detailFieldsContent.map(createDetailItem)}
          withOverflow={false}
          withSeparators
          isLoading={isLoading}
          tw="font-mini-book [--details-value-font:--font-small-book]"
        />

        {!hasNoPositionInMarket && actions}
      </div>
    </$PositionInfo>
  );
};
const $DiffOutput = styled(DiffOutput)`
  --diffOutput-gap: 0.125rem;
  --diffOutput-value-color: var(--color-text-2);
  --diffOutput-valueWithDiff-color: var(--color-text-0);
  --diffOutput-valueWithDiff-font: var(--font-small-book);

  justify-items: inherit;
`;

const $PrimaryDetails = styled(Details)`
  font: var(--font-mini-book);
  --details-value-font: var(--font-base-book);

  > div {
    gap: 0.5rem;
    height: 4.75rem;
    grid-template-rows: auto 1fr;
  }

  dd {
    justify-items: inherit;
    align-items: flex-start;
  }
`;
const $MobileDetails = styled(Details)`
  font: var(--font-small-book);
  --details-value-font: var(--font-medium-medium);

  > div > dd,
  dt {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

const $Actions = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  > :first-child {
    flex: 1;
  }

  > :last-child {
    flex: 2;
  }
`;

const $Output = styled(Output)<{ sign?: NumberSign; smallText?: boolean; margin?: string }>`
  color: ${({ sign }) =>
    sign == null
      ? undefined
      : {
          [NumberSign.Positive]: `var(--color-positive)`,
          [NumberSign.Negative]: `var(--color-negative)`,
          [NumberSign.Neutral]: `var(--color-text-2)`,
        }[sign]};

  ${({ smallText }) =>
    smallText &&
    css`
      color: var(--color-text-0);
      font: var(--font-small-book);
    `};

  ${({ margin }) => margin && `margin: ${margin};`}
`;

const $PositionInfo = styled.div`
  margin: 0 auto;
  width: 100%;

  ${layoutMixins.gridConstrainedColumns}
  --grid-max-columns: 2;
  --column-gap: 2rem;
  --column-min-width: 18.8rem;
  --column-max-width: 23.75rem;
  --single-column-max-width: 26rem;

  justify-content: center;
  align-items: start;
  padding: clamp(0.5rem, 7.5%, 2rem);
  padding-bottom: 0;
  row-gap: 1rem;

  > * {
    ${layoutMixins.column}

    // Position Tile & Primary Details
    &:nth-child(1) {
      gap: 1.5rem;
    }

    // Secondary Details & Actions
    &:nth-child(2) {
      gap: 1rem;
    }
  }
`;

const $DetachedSection = styled(DetachedSection)`
  padding: 0 1.5rem;
  position: relative;
`;

const $DetachedScrollableSection = styled(DetachedScrollableSection)`
  padding: 0 1.5rem;
`;

const $MobilePositionInfo = styled.div`
  ${layoutMixins.column}
  gap: 1rem;

  > ${$DetachedSection}:nth-child(1) {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;

    > ${() => $PositionTile} {
      flex: 2 9rem;

      // Icon + Tags
      > div:nth-child(1) {
        gap: 0.5rem;
      }
    }

    > ${$MobileDetails} {
      flex: 1 9rem;
    }
  }

  > ${$DetachedScrollableSection}:nth-child(2) {
    // Profit/Loss Section
    > ${$MobileDetails} {
      margin: 0 -1rem;
    }
  }

  > ${$DetachedSection}:nth-last-child(1) {
    // Other Details Section
    > ${$MobileDetails} {
      margin: 0 -0.25rem;
      --details-value-font: var(--font-base-book);
    }
  }
`;

const $PositionTile = styled(PositionTile)``;

const $ClosePositionButton = styled(Button)`
  --button-border: solid var(--border-width) var(--color-border-red);
  --button-textColor: var(--color-red);
`;

const $ClosePositionToggleButton = styled(ToggleButton)`
  --button-border: solid var(--border-width) var(--color-border-red);
  --button-toggle-off-textColor: var(--color-red);
  --button-toggle-on-textColor: var(--color-red);
`;
