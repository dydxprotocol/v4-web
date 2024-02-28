import styled, { css } from 'styled-components';

type GradientCardProps = React.PropsWithChildren<{
  className?: string;
  fromColor?: 'positive' | 'negative' | 'neutral';
  toColor?: 'positive' | 'negative' | 'neutral';
}>;

export const GradientCard = ({ children, className, fromColor, toColor }: GradientCardProps) => {
  return (
    <$GradientCard className={className} fromColor={fromColor} toColor={toColor}>
      {children}
    </$GradientCard>
  );
};
const $GradientCard = styled.div<{
  fromColor?: GradientCardProps['fromColor'];
  toColor?: GradientCardProps['toColor'];
}>`
  // Props/defaults
  --from-color: transparent;
  --to-color: transparent;

  // Constants
  --default-gradient: linear-gradient(
    342.62deg,
    var(--color-gradient-base-0) -9.23%,
    var(--color-gradient-base-1) 110.36%
  );

  ${({ fromColor, toColor }) =>
    css`
      --from-color: ${{
        positive: css`var(--color-gradient-positive)`,
        neutral: css`transparent`,
        negative: css`var(--color-gradient-negative)`,
      }[fromColor ?? 'neutral']};

      --to-color: ${{
        positive: css`var(--color-gradient-positive)`,
        neutral: css`transparent`,
        negative: css`var(--color-gradient-negative)`,
      }[toColor ?? 'neutral']};
    `}

  background: linear-gradient(130.25deg, var(--from-color) 0.9%, transparent 64.47%),
    linear-gradient(227.14deg, var(--to-color) 1.6%, transparent 63.87%),
    var(--default-gradient);
`;
