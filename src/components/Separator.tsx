import { Fragment } from 'react';

import { Separator } from '@radix-ui/react-separator';
import styled, { css } from 'styled-components';

const StyledSeparator = styled(Separator)<{ fullHeight: boolean }>`
  flex: 0 !important;
  z-index: -1;

  &[data-orientation='horizontal'] {
    align-self: stretch;
    /* margin: 0 0 calc(-1 * var(--border-width)) 0 !important; */

    border-bottom: solid var(--border-width) var(--color-border);
  }

  &[data-orientation='vertical'] {
    align-self: center;
    width: 0;
    height: ${({ fullHeight }) => css`
      ${fullHeight ? css`100%;` : css`calc(100% - 1.5rem);`}
    `}
    margin: 0 !important;

    border-right: solid var(--border-width) var(--color-border);
  }
`;

export const VerticalSeparator = ({
  className,
  decorative = false,
  fullHeight = false,
}: {
  className?: string;
  decorative?: boolean;
  fullHeight?: boolean;
}) => (
  <StyledSeparator
    className={className}
    orientation="vertical"
    decorative={decorative}
    fullHeight={fullHeight}
  />
);

export const WithSeparators = ({
  layout,
  children,
  withSeparators = true,
  fullHeight = false,
}: {
  layout: 'column' | 'row';
  children: React.ReactNode;
  withSeparators?: boolean;
  fullHeight?: boolean;
}) =>
  withSeparators
    ? [children].flat().map((child, i, { length }) => (
        // eslint-disable-next-line react/no-array-index-key
        <Fragment key={i}>
          {child}
          {i < length - 1 && (
            <StyledSeparator
              fullHeight={fullHeight}
              orientation={
                (
                  {
                    column: 'horizontal',
                    row: 'vertical',
                  } as const
                )[layout]
              }
              decorative
            />
          )}
        </Fragment>
      ))
    : children;
export const HorizontalSeparatorFiller = ({ className }: { className?: string }) => (
  <Separator
    className={className}
    orientation="horizontal"
    decorative
    tw="h-[--border-width] flex-1 bg-color-border"
  />
);
