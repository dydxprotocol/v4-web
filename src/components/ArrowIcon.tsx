import styled, { css } from 'styled-components';

import { Icon, IconName } from './Icon';

export const ArrowIcon = (props: { direction: 'up' | 'down'; color: string }) => {
  return <$ArrowIcon {...props} iconName={IconName.Arrow} />;
};

const $ArrowIcon = styled(Icon)<{ direction: 'up' | 'down'; color: string }>`
  position: absolute;
  ${({ direction }) =>
    ({
      up: css`
        transform: rotate(-90deg);
      `,
      down: css`
        transform: rotate(90deg);
      `,
    })[direction]}
  ${({ color }) => css`
    color: var(${color});
  `};
`;
