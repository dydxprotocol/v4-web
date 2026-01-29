import * as $ from './_MarketStatsBase.css';

type MarketStatProps = {
  label: string;
  value: string;
  variant?: 'default' | 'positive' | 'negative';
};

export function MarketStat({ label, value, variant = 'default' }: MarketStatProps) {
  const valueStyles = [$.statValue];
  if (variant === 'positive') valueStyles.push($.statValuePositive);
  if (variant === 'negative') valueStyles.push($.statValueNegative);

  return (
    <div css={$.stat}>
      <span css={$.statLabel}>{label}</span>
      <span css={valueStyles}>{value}</span>
    </div>
  );
}
