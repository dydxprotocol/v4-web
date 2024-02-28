import BigNumber from 'bignumber.js';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { NumberSign } from '@/constants/numbers';

import { Icon, IconName } from './Icon';

type ElementProps = {
  value: BigNumber;
};

type StyleProps = {
  className?: string;
};

export type TriangleIndicatorProps = ElementProps & StyleProps;

const getSign = (num: BigNumber) =>
  num.gt(0) ? NumberSign.Positive : num.lt(0) ? NumberSign.Negative : NumberSign.Neutral;

export const TriangleIndicator = ({ className, value }: TriangleIndicatorProps) => {
  return (
    <$TriangleIndicator className={className} sign={getSign(value)}>
      <Icon iconName={IconName.Triangle} />
    </$TriangleIndicator>
  );
};
const $TriangleIndicator = styled.div<{ sign: NumberSign }>`
  display: flex;
  align-items: center;
  height: 100%;
  margin-top: 0.0625rem;

  svg {
    width: 0.375em;
    height: 0.375em;
  }

  ${({ sign }) =>
    ({
      [NumberSign.Positive]: css`
        color: var(--color-positive);

        svg {
          transform: rotate(180deg);
        }
      `,
      [NumberSign.Negative]: css`
        color: var(--color-negative);
      `,
      [NumberSign.Neutral]: css`
        svg {
          transform: rotate(180deg);
        }
      `,
    }[sign])}
`;
