import { Fragment } from 'react';
import styled, { css } from 'styled-components';

import { Separator } from '@radix-ui/react-separator';

const StyledSeparator = styled(Separator)`
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
    height: calc(100% - 1.5rem);
    margin: 0 !important;

    border-right: solid var(--border-width) var(--color-border);
  }
`;

export const HorizontalSeparator = ({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) => <StyledSeparator className={className} orientation="horizontal" decorative={decorative} />;

export const VerticalSeparator = ({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) => <StyledSeparator className={className} orientation="vertical" decorative={decorative} />;

export const WithSeparators = ({
  layout,
  children,
  withSeparators = true,
}: {
  layout: 'column' | 'row';
  children: React.ReactNode;
  withSeparators?: boolean;
}) => (
  <>
    {withSeparators
      ? [children].flat().map((child, i, { length }) => (
          <Fragment key={i}>
            {child}
            {i < length - 1 && (
              <StyledSeparator
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
      : children}
  </>
);

export const HorizontalSeparatorWithText = styled(HorizontalSeparator)<{ contents?: string }>`
  --contents: '';

  ${({ contents }) =>
    contents &&
    css`
      --contents: '${contents}';
    `}

  position: relative;

  &:before {
    content: var(--contents);
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: inherit;
    padding: 0 0.5em;
  }
`;

const StyledHorizontalSeparatorFiller = styled(Separator)`
  flex: 1;
  height: var(--border-width);
  background-color: var(--color-border);
`;

export const HorizontalSeparatorFiller = ({ className }: { className?: string }) => (
  <StyledHorizontalSeparatorFiller className={className} orientation="horizontal" decorative />
);
