import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent, css } from 'styled-components';

import { type Nullable } from '@/constants/abacus';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, USD_DECIMALS } from '@/constants/numbers';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DetachedSection, DetachedScrollableSection } from '@/components/ContentSection';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ToggleButton } from '@/components/ToggleButton';

import { calculateIsAccountLoading } from '@/state/accountCalculators';
import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { closeDialogInTradeBox, openDialog, openDialogInTradeBox } from '@/state/dialogs';
import { getActiveDialog, getActiveTradeBoxDialog } from '@/state/dialogsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { BIG_NUMBERS, isNumber, MustBigNumber } from '@/lib/numbers';
import { hasPositionSideChanged } from '@/lib/tradeData';

import { PositionTile } from './PositionTile';

type PositionInfoItems = {
  // Key/Type
  key: string;
  type: OutputType;

  // Label Properties
  label: string;
  tooltip?: string;
  tooltipParams?: Record<string, string>;

  // Output/DiffOutput Properties
  fractionDigits?: number | null;
  hasInvalidNewValue?: boolean;
  sign?: NumberSign;
  showSign?: ShowSign;
  useDiffOutput?: boolean;
  withBaseFont?: boolean;

  // Values
  value: Nullable<number> | string;
  newValue?: Nullable<number> | string;
  percentValue?: Nullable<number> | string;
};

export const PositionInfo = ({ showNarrowVariation }: { showNarrowVariation?: boolean }) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const dispatch = useDispatch();

  const currentMarketAssetData = useSelector(getCurrentMarketAssetData, shallowEqual);
  const currentMarketConfigs = useSelector(getCurrentMarketConfig, shallowEqual);
  const activeDialog = useSelector(getActiveDialog, shallowEqual);
  const activeTradeBoxDialog = useSelector(getActiveTradeBoxDialog);
  const currentMarketPosition = useSelector(getCurrentMarketPositionData, shallowEqual);
  const isLoading = useSelector(calculateIsAccountLoading);

  const { stepSizeDecimals, tickSizeDecimals } = currentMarketConfigs || {};
  const { id } = currentMarketAssetData || {};
  const { type: dialogType } = activeDialog || {};
  const { type: tradeBoxDialogType } = activeTradeBoxDialog || {};

  const {
    adjustedImf,
    entryPrice,
    exitPrice,
    leverage,
    liquidationPrice,
    netFunding,
    notionalTotal,
    realizedPnl,
    size,
    unrealizedPnl,
    unrealizedPnlPercent,
  } = currentMarketPosition || {};

  const netFundingBN = MustBigNumber(netFunding);

  const detailFieldsContent: PositionInfoItems[] = [
    {
      key: 'average-open',
      type: OutputType.Fiat,
      label: STRING_KEYS.AVERAGE_OPEN,
      fractionDigits: tickSizeDecimals,
      value: entryPrice?.current,
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

  const { current: currentSize, postOrder: postOrderSize } = size || {};
  const leverageBN = MustBigNumber(leverage?.current);
  const newLeverageBN = MustBigNumber(leverage?.postOrder);
  const maxLeverage = BIG_NUMBERS.ONE.div(MustBigNumber(adjustedImf?.postOrder));
  const newPositionIsClosed = MustBigNumber(postOrderSize).isZero();
  const hasNoPositionInMarket = MustBigNumber(currentSize).isZero();

  const newLeverageIsInvalid =
    leverage?.postOrder && (!newLeverageBN.isFinite() || newLeverageBN.gt(maxLeverage));

  const newLeverageIsLarger =
    !leverage?.current || (leverage?.postOrder && newLeverageBN.gt(leverageBN));

  let liquidationArrowSign = NumberSign.Neutral;
  const newLiquidationPriceIsLarger = MustBigNumber(liquidationPrice?.postOrder).gt(
    MustBigNumber(liquidationPrice?.current)
  );

  const positionSideHasChanged = hasPositionSideChanged({
    currentSize,
    postOrderSize,
  }).positionSideHasChanged;

  if (leverage?.postOrder) {
    if (newLeverageIsInvalid) {
      liquidationArrowSign = NumberSign.Negative;
    } else if (newPositionIsClosed) {
      liquidationArrowSign = NumberSign.Positive;
    } else if (positionSideHasChanged) {
      liquidationArrowSign = NumberSign.Neutral;
    } else if (
      liquidationPrice?.current && MustBigNumber(currentSize).gt(0)
        ? !newLiquidationPriceIsLarger
        : newLiquidationPriceIsLarger
    ) {
      liquidationArrowSign = NumberSign.Positive;
    } else if (
      !liquidationPrice?.current ||
      (!newPositionIsClosed && MustBigNumber(currentSize).gt(0)
        ? newLiquidationPriceIsLarger
        : !newLiquidationPriceIsLarger)
    ) {
      liquidationArrowSign = NumberSign.Negative;
    }
  }

  const mainFieldsContent: PositionInfoItems[] = [
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
      value: leverage?.current,
      newValue: leverage?.postOrder,
      withBaseFont: true,
    },
    {
      key: 'liquidation-price',
      type: OutputType.Fiat,
      label: STRING_KEYS.LIQUIDATION_PRICE,
      tooltip: 'liquidation-price',
      tooltipParams: {
        SYMBOL: id || '',
      },
      fractionDigits: tickSizeDecimals,
      hasInvalidNewValue: Boolean(newLeverageIsInvalid),
      sign: liquidationArrowSign,
      useDiffOutput: true,
      value: liquidationPrice?.current,
      newValue: liquidationPrice?.postOrder,
      withBaseFont: true,
    },
    {
      key: 'unrealized-pnl',
      type: OutputType.Fiat,
      label: STRING_KEYS.UNREALIZED_PNL,
      tooltip: 'unrealized-pnl',
      sign: MustBigNumber(unrealizedPnl?.current).gt(0)
        ? NumberSign.Positive
        : MustBigNumber(unrealizedPnl?.current).lt(0)
        ? NumberSign.Negative
        : NumberSign.Neutral,
      value: unrealizedPnl?.current,
      percentValue: unrealizedPnlPercent?.current,
      withBaseFont: true,
    },
    {
      key: 'realized-pnl',
      type: OutputType.Fiat,
      label: STRING_KEYS.REALIZED_PNL,
      tooltip: 'realized-pnl',
      sign: MustBigNumber(realizedPnl?.current).gt(0)
        ? NumberSign.Positive
        : MustBigNumber(realizedPnl?.current).lt(0)
        ? NumberSign.Negative
        : NumberSign.Neutral,
      value: realizedPnl?.current || undefined,
      withBaseFont: true,
    },
  ];

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
  }: PositionInfoItems) => ({
    key,
    label: stringGetter({ key: label }),
    tooltip,
    tooltipParams,
    value: (
      <>
        {useDiffOutput ? (
          <Styled.DiffOutput
            type={type}
            value={value}
            newValue={newValue}
            fractionDigits={fractionDigits}
            hasInvalidNewValue={hasInvalidNewValue}
            layout={isTablet ? 'row' : 'column'}
            sign={sign}
            showSign={showSign}
            withBaseFont={withBaseFont}
            withDiff={isNumber(newValue) && value !== newValue}
          />
        ) : (
          <Styled.Output
            type={type}
            value={value}
            fractionDigits={fractionDigits}
            showSign={showSign}
            sign={sign}
            slotRight={
              percentValue && (
                <Styled.Output
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
          />
        )}
      </>
    ),
  });

  const actions = (
    <Styled.Actions>
      {isTablet ? (
        <Styled.ClosePositionButton
          onClick={() => dispatch(openDialog({ type: DialogTypes.ClosePosition }))}
        >
          {stringGetter({ key: STRING_KEYS.CLOSE_POSITION })}
        </Styled.ClosePositionButton>
      ) : (
        <Styled.ClosePositionToggleButton
          isPressed={tradeBoxDialogType === TradeBoxDialogTypes.ClosePosition}
          onPressedChange={(isPressed: boolean) => {
            dispatch(
              isPressed
                ? openDialogInTradeBox({ type: TradeBoxDialogTypes.ClosePosition })
                : closeDialogInTradeBox()
            );

            if (!isPressed)
              abacusStateManager.clearClosePositionInputValues({ shouldFocusOnTradeInput: true });
          }}
        >
          {stringGetter({ key: STRING_KEYS.CLOSE_POSITION })}
        </Styled.ClosePositionToggleButton>
      )}
    </Styled.Actions>
  );

  if (showNarrowVariation) {
    return (
      <Styled.MobilePositionInfo>
        <Styled.DetachedSection>
          <PositionTile
            currentSize={size?.current}
            notionalTotal={notionalTotal?.current}
            postOrderSize={size?.postOrder}
            stepSizeDecimals={stepSizeDecimals}
            symbol={id || undefined}
            tickSizeDecimals={tickSizeDecimals}
            showNarrowVariation={showNarrowVariation}
            isLoading={isLoading}
          />

          <Styled.MobileDetails
            items={[mainFieldsContent[0], mainFieldsContent[1]].map(createDetailItem)}
            layout="stackColumn"
            withSeparators
            isLoading={isLoading}
          />
        </Styled.DetachedSection>

        <Styled.DetachedScrollableSection>
          <Styled.MobileDetails
            items={[mainFieldsContent[2], mainFieldsContent[3]].map(createDetailItem)}
            layout="rowColumns"
            withSeparators
            isLoading={isLoading}
          />
        </Styled.DetachedScrollableSection>

        {!hasNoPositionInMarket && <Styled.DetachedSection>{actions}</Styled.DetachedSection>}

        <Styled.DetachedSection>
          <Styled.MobileDetails
            items={detailFieldsContent.map(createDetailItem)}
            withSeparators
            isLoading={isLoading}
          />
        </Styled.DetachedSection>
      </Styled.MobilePositionInfo>
    );
  }

  return (
    <Styled.PositionInfo>
      <div>
        <PositionTile
          currentSize={size?.current}
          notionalTotal={notionalTotal?.current}
          postOrderSize={size?.postOrder}
          stepSizeDecimals={stepSizeDecimals}
          symbol={id || undefined}
          tickSizeDecimals={tickSizeDecimals}
          isLoading={isLoading}
        />

        <Styled.PrimaryDetails
          items={mainFieldsContent.map(createDetailItem)}
          justifyItems="end"
          layout="grid"
          withOverflow={false}
          isLoading={isLoading}
        />
      </div>

      <div>
        <Styled.SecondaryDetails
          items={detailFieldsContent.map(createDetailItem)}
          withOverflow={false}
          withSeparators
          isLoading={isLoading}
        />

        {!hasNoPositionInMarket && actions}
      </div>
    </Styled.PositionInfo>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DiffOutput = styled(DiffOutput)`
  --diffOutput-gap: 0.125rem;
  --diffOutput-value-color: var(--color-text-2);
  --diffOutput-valueWithDiff-color: var(--color-text-0);
  --diffOutput-valueWithDiff-font: var(--font-small-book);

  justify-items: inherit;
`;

Styled.PrimaryDetails = styled(Details)`
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

Styled.SecondaryDetails = styled(Details)`
  font: var(--font-mini-book);
  --details-value-font: var(--font-small-book);
`;

Styled.MobileDetails = styled(Details)`
  font: var(--font-small-book);
  --details-value-font: var(--font-medium-medium);

  > div > dd,
  dt {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

Styled.Actions = styled.footer`
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

Styled.Output = styled(Output)<{ sign: NumberSign; smallText?: boolean; margin?: string }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    }[sign])};

  ${({ smallText }) =>
    smallText &&
    css`
      color: var(--color-text-0);
      font: var(--font-small-book);
    `};

  ${({ margin }) => margin && `margin: ${margin};`}
`;

Styled.PositionInfo = styled.div`
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

Styled.DetachedSection = styled(DetachedSection)`
  padding: 0 1.5rem;
  position: relative;
`;

Styled.DetachedScrollableSection = styled(DetachedScrollableSection)`
  padding: 0 1.5rem;
`;

Styled.MobilePositionInfo = styled.div`
  ${layoutMixins.column}
  gap: 1rem;

  > ${Styled.DetachedSection}:nth-child(1) {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;

    > ${() => Styled.PositionTile} {
      flex: 2 9rem;

      // Icon + Tags
      > div:nth-child(1) {
        gap: 0.5rem;
      }
    }

    > ${Styled.MobileDetails} {
      flex: 1 9rem;
    }
  }

  > ${Styled.DetachedScrollableSection}:nth-child(2) {
    // Profit/Loss Section
    > ${Styled.MobileDetails} {
      margin: 0 -1rem;
    }
  }

  > ${Styled.DetachedSection}:nth-last-child(1) {
    // Other Details Section
    > ${Styled.MobileDetails} {
      margin: 0 -0.25rem;
      --details-value-font: var(--font-base-book);
    }
  }
`;

Styled.PositionTile = styled(PositionTile)``;

Styled.ClosePositionButton = styled(Button)`
  --button-border: solid var(--border-width) var(--color-border-red);
  --button-textColor: var(--color-red);
`;

Styled.ClosePositionToggleButton = styled(ToggleButton)`
  --button-border: solid var(--border-width) var(--color-border-red);
  --button-toggle-off-textColor: var(--color-red);
  --button-toggle-on-textColor: var(--color-red);
`;
