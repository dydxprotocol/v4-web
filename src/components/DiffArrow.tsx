import styled, { AnyStyledComponent, css } from 'styled-components';

import { NumberSign } from '@/constants/numbers';

import { Icon, IconName } from './Icon';

type ElementProps = {
  sign?: NumberSign;
};

type StyleProps = {
  className?: string;
  direction?: 'right' | 'left';
};

export type DiffArrowProps = ElementProps & StyleProps;

export const DiffArrow = ({ className, direction = 'right', sign }: DiffArrowProps) => (
  <Styled.DiffArrowContainer className={className} direction={direction} sign={sign}>
    <Icon iconName={IconName.Arrow} />
  </Styled.DiffArrowContainer>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DiffArrowContainer = styled.span<DiffArrowProps>`
  --diffArrow-color: inherit;
  --diffArrow-color-positive: var(--color-positive);
  --diffArrow-color-negative: var(--color-negative);

  display: inline-flex;
  position: relative;
  color: var(--diffArrow-color);

  svg {
    width: 0.5em;
    height: 0.5em;
  }

  ${({ sign }) =>
    sign &&
    {
      [NumberSign.Positive]: css`
        color: var(--diffArrow-color-positive);
      `,
      [NumberSign.Negative]: css`
        color: var(--diffArrow-color-negative);
      `,
      [NumberSign.Neutral]: null,
    }[sign]}

  ${({ direction }) =>
    ({
      right: css`
        transform: scaleX(1);
      `,
      left: css`
        transform: scaleX(-1);
      `,
    }[direction || 'right'])}
`;
