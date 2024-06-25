import { forwardRef } from 'react';

import styled, { css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  analyticsConfig?: {
    event: string;
    meta?: any;
  };
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  withIcon?: boolean;
};

type StyleProps = {
  isInline?: boolean;
  className?: string;
};

export const Link = forwardRef<HTMLAnchorElement, ElementProps & StyleProps>(
  (
    {
      analyticsConfig,
      children,
      href,
      onClick,
      withIcon = false,
      isInline = false,
      className,
      ...props
    }: ElementProps & StyleProps,
    ref
  ) => (
    <$A
      ref={ref}
      isInline={isInline}
      withIcon={withIcon}
      className={className}
      href={href}
      onClick={(e: React.MouseEvent) => {
        if (analyticsConfig) {
          // eslint-disable-next-line no-console
          console.log(analyticsConfig);
        }

        onClick?.(e);
      }}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
      {withIcon && <Icon iconName={IconName.LinkOut} />}
    </$A>
  )
);
const $A = styled.a<StyleProps & { withIcon: boolean }>`
  --link-color: inherit;
  color: var(--link-color);

  ${layoutMixins.spacedRow}
  gap: 0.25em;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:visited {
    color: var(--link-color);
  }

  ${({ isInline, withIcon }) =>
    isInline && withIcon
      ? css`
          display: inline-flex;
        `
      : isInline
        ? css`
            display: inline;
          `
        : undefined}
`;
