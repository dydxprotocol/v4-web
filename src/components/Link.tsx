import { forwardRef } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { Icon, IconName } from '@/components/Icon';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  analyticsConfig?: {
    event: string;
    meta?: any;
  };
  children: React.ReactNode;
  href?: string;
  onClick?: (e: MouseEvent) => void;
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
    <Styled.A
      ref={ref}
      className={className}
      href={href}
      onClick={(e: MouseEvent) => {
        if (analyticsConfig) {
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
    </Styled.A>
  )
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.A = styled.a<StyleProps>`
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
