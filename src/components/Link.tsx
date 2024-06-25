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
  isAccent?: boolean;
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
      isAccent = false,
      className,
      ...props
    }: ElementProps & StyleProps,
    ref
  ) => (
    <$A
      ref={ref}
      isInline={isInline}
      isAccent={isAccent}
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
  --link-color: var(--color-text-1);
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
          ${layoutMixins.inlineRow}
          text-decoration: underline;
        `
      : isInline
        ? css`
            display: inline;
            text-decoration: underline;
          `
        : undefined}

  ${({ isAccent }) =>
    isAccent &&
    css`
      --link-color: var(--color-accent);
      text-decoration: none;

      &:visited {
        color: var(--color-accent);
      }
    `}
`;
