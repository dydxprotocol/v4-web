import { SortDirection } from 'react-stately';
import styled, { css } from 'styled-components';

import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  sortDirection: SortDirection | 'none';
};

type StyleProps = {
  className?: string;
};

export const SortIcon = ({ sortDirection, className }: ElementProps & StyleProps) => {
  return (
    <$SortIcon aria-hidden="true" hidden={sortDirection === 'none'} className={className}>
      <$Icon
        iconName={IconName.Arrow}
        aria-hidden="true"
        direction="up"
        highlighted={sortDirection === 'ascending'}
        tw="relative right-[-2px] top-[-3px]"
      />
      <$Icon
        iconName={IconName.Arrow}
        aria-hidden="true"
        direction="down"
        highlighted={sortDirection === 'descending'}
        tw="relative bottom-[-3px] left-[-2px]"
      />
    </$SortIcon>
  );
};

const $SortIcon = styled.div<{ hidden: boolean }>`
  display: inline-flex;
  position: relative;
  transition: opacity 0.3s var(--ease-out-expo);

  svg {
    width: 0.75em;
    height: 0.75em;
  }

  ${({ hidden }) =>
    hidden
      ? css`
          opacity: 0;
        `
      : css`
          opacity: 1;
        `}
`;

const $Icon = styled(Icon)<{ direction: 'up' | 'down'; highlighted: boolean }>`
  ${({ highlighted }) =>
    highlighted
      ? css`
          color: var(--color-text-2);
        `
      : css`
          color: var(--color-text-0);
        `}
  ${({ direction }) =>
    ({
      up: css`
        transform: rotate(-90deg);
      `,
      down: css`
        transform: rotate(90deg);
      `,
    })[direction]}
`;
