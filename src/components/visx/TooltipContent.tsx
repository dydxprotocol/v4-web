import styled, { css, type AnyStyledComponent } from 'styled-components';

import { popoverMixins } from '@/styles/popoverMixins';

type ElementProps = {
  children: React.ReactNode;
};

type StyleProps = {
  accentColor?: string;
};

export const TooltipContent = ({ children, accentColor }: ElementProps & StyleProps) => (
  <Styled.TooltipContent accentColor={accentColor}>{children}</Styled.TooltipContent>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TooltipContent = styled.aside<{ accentColor?: string }>`
  --accent-color: currentColor;

  ${({ accentColor }) =>
    accentColor &&
    css`
      --accent-color: ${accentColor};
    `}

  ${popoverMixins.popover}
  --popover-radius: 0.5rem;
  --popover-background-color: ${({ theme }) => theme.popoverBackground};
  --popover-backdrop-filter: saturate(120%) blur(12px);

  display: grid;
  gap: 0.25rem;
  overflow: hidden;
  padding: 0.5rem 0.75rem;

  /* Safari */
  width: max-content;

  /* Firefox */
  dl {
    margin: 0;
  }

  &:before {
    content: '';

    position: absolute;
    inset: 0;
    width: 2px;

    background-color: var(--accent-color);

    transition: 0.2s;
  }

  h4 {
    line-height: 1.75;
  }
`;
