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
        iconName={IconName.RoundedArrow}
        aria-hidden="true"
        direction="up"
        highlighted={sortDirection === 'ascending'}
        size="0.75em"
        tw="relative right-[-2px] top-[-3px]"
      />
      <$Icon
        iconName={IconName.RoundedArrow}
        aria-hidden="true"
        direction="down"
        highlighted={sortDirection === 'descending'}
        size="0.75em"
        tw="relative bottom-[-3px] left-[-2px]"
      />
    </$SortIcon>
  );
};

const $SortIcon = styled.div<{ hidden: boolean }>`
  display: inline-flex;
  position: relative;
  transition: opacity 0.3s var(--ease-out-expo);

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
      up: css``,
      down: css`
        transform: rotate(180deg);
      `,
    })[direction]}
`;
