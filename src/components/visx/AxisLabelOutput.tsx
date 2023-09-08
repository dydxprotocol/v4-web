import styled, { css, type AnyStyledComponent } from 'styled-components';

import { Output } from '../Output';

type ElementProps = {
  children: React.ReactNode;
} & Parameters<typeof Output>[0];

type StyleProps = {
  accentColor?: string;
};

export const AxisLabelOutput = ({ children, accentColor, ...props }: ElementProps & StyleProps) => (
  <Styled.AxisLabelOutput accentColor={accentColor} {...props}>
    {children}
  </Styled.AxisLabelOutput>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AxisLabelOutput = styled(Output)<{ accentColor?: string }>`
  --accent-color: var(--color-layer-6);

  ${({ accentColor }) =>
    accentColor &&
    css`
      --accent-color: ${accentColor};
    `}

  offset: path('M 0 0') 0px;

  display: inline-block;
  padding: 0.15em 0.4em;
  border-radius: 0.25em;

  color: white;

  background-color: var(--accent-color);
`;
