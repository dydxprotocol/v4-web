import { forwardRef } from 'react';

import styled from 'styled-components';

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
  className?: string;
};

export const Link = forwardRef<HTMLAnchorElement, ElementProps & StyleProps>(
  (
    {
      analyticsConfig,
      children,
      className,
      href,
      onClick,
      withIcon = false,
      ...props
    }: ElementProps & StyleProps,
    ref
  ) => (
    <$A
      ref={ref}
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
const $A = styled.a<StyleProps>`
  --link-color: inherit;
  color: var(--link-color);

  ${layoutMixins.spacedRow}
  gap: 0.25em;

  &:hover {
    text-decoration: underline;
  }

  &:visited {
    color: var(--link-color);
  }
`;
