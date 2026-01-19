import type { FC } from 'react';
import { MinusIcon } from '@radix-ui/react-icons';
import { Tooltip } from '@radix-ui/themes';
import { $decimalValue } from 'fuel-ts-sdk';
import { type PositionEntity, calculatePositionLeverage } from 'fuel-ts-sdk/trading';
import { useBoolean } from 'usehooks-ts';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import * as styles from './PositionCard.css';
import { DecreasePositionDialog } from './components/DecreasePositionDialog';

type PositionCardProps = {
  position: PositionEntity;
};

export const PositionCard: FC<PositionCardProps> = ({ position }) => {
  const tradingSdk = useTradingSdk();
  const asset = useSdkQuery(() => tradingSdk.getAssetById(position.positionKey.indexAssetId));

  const markPrice = useSdkQuery(() =>
    tradingSdk.getAssetLatestPrice(position.positionKey.indexAssetId)
  );
  const markPriceValue = markPrice ? $decimalValue(markPrice.value).toFloat() : null;

  const leverage = calculatePositionLeverage(position);
  const leverageValue = $decimalValue(leverage).toFloat();

  const pnlValue = $decimalValue(position.pnlDelta).toFloat();
  const isProfitable = pnlValue >= 0;
  const pnlPercent = (pnlValue / $decimalValue(position.collateralAmount).toFloat()) * 100;

  const sizeValue = $decimalValue(position.size).toFloat();
  const collateralValue = $decimalValue(position.collateralAmount).toFloat();
  const realizedPnlValue = $decimalValue(position.realizedPnl).toFloat();
  const accruedFundingValue = $decimalValue(position.fundingRate).toFloat();
  const positionFeeValue = $decimalValue(position.positionFee).toFloat();

  const modalOpenBoolean = useBoolean();

  const formatUsd = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPrice = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPnl = (value: number) => {
    const formatted = formatUsd(Math.abs(value));
    return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div css={styles.positionCard}>
      <div css={styles.positionHeader}>
        <span
          css={[
            styles.positionSide,
            position.positionKey.isLong ? styles.longPosition : styles.shortPosition,
          ]}
        >
          {position.positionKey.isLong ? 'LONG' : 'SHORT'}
        </span>

        <div css={styles.assetInfo}>
          <span css={styles.assetSymbol}>{asset?.name}</span>
          <span css={styles.leverageBadge}>{leverageValue.toFixed(1)}x</span>
        </div>

        <div css={styles.headerActions}>
          <div css={styles.pnlContainer}>
            <span css={[styles.pnlDisplay, isProfitable ? styles.pnlPositive : styles.pnlNegative]}>
              {formatPnl(pnlValue)}
            </span>
            <span css={[styles.pnlPercent, isProfitable ? styles.pnlPositive : styles.pnlNegative]}>
              ({formatPercent(pnlPercent)})
            </span>
          </div>
          <Tooltip content="Decrease or close position">
            <button className={styles.iconButton} onClick={modalOpenBoolean.setTrue}>
              <MinusIcon />
            </button>
          </Tooltip>
        </div>

        <DecreasePositionDialog
          positionId={position.positionKey.id}
          open={modalOpenBoolean.value}
          onOpenChange={modalOpenBoolean.setValue}
        />
      </div>

      <div css={styles.priceRow}>
        <span css={styles.priceLabel}>Entry</span>
        <span css={styles.priceValueMuted}>—</span>
        <span css={styles.priceSeparator} />
        {markPriceValue !== null ? (
          <>
            <span css={styles.priceLabel}>Mark</span>
            <span css={styles.priceValue}>${formatPrice(markPriceValue)}</span>
          </>
        ) : (
          <>
            <span css={styles.priceLabel}>Mark</span>
            <span css={styles.priceValueMuted}>—</span>
          </>
        )}
        <span css={styles.priceSeparator} />
        <span css={styles.priceLabel}>Liq</span>
        <span css={styles.priceValueMuted}>—</span>
      </div>

      <div css={styles.statsGrid}>
        <StatCell label="Size" value={`${formatUsd(sizeValue)}`} />
        <StatCell label="Collateral" value={`$${formatUsd(collateralValue)}`} />
        <StatCell
          label="Realized"
          value={formatPnl(realizedPnlValue)}
          variant={realizedPnlValue >= 0 ? 'positive' : 'negative'}
        />
        <StatCell label="Fees" value={`$${formatUsd(positionFeeValue)}`} variant="muted" />
        <StatCell
          label="Funding"
          value={`${accruedFundingValue >= 0 ? '+' : ''}${(accruedFundingValue * 100).toFixed(4)}%`}
          variant="muted"
        />
      </div>
    </div>
  );
};

type StatCellProps = {
  label: string;
  value: string;
  variant?: 'default' | 'muted' | 'positive' | 'negative';
};

function StatCell({ label, value, variant = 'default' }: StatCellProps) {
  const valueStyle = [
    styles.statValue,
    variant === 'muted' && styles.statValueMuted,
    variant === 'positive' && styles.statValuePositive,
    variant === 'negative' && styles.statValueNegative,
  ];

  return (
    <div css={styles.statCell}>
      <span css={styles.statLabel}>{label}</span>
      <span css={valueStyle}>{value}</span>
    </div>
  );
}
