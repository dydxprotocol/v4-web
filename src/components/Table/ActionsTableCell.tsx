import React from 'react';

import styled, { css, type AnyStyledComponent } from 'styled-components';

import { Toolbar } from '@/components/Toolbar';

type ElementProps = {
  children: React.ReactNode;
};

export const ActionsTableCell = ({ children }: ElementProps) => (
  <Styled.ActionsCell>
    <Styled.Toolbar $numChildren={React.Children.toArray(children).length}>
      {children}
    </Styled.Toolbar>
  </Styled.ActionsCell>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ActionsCell = styled.div`
  display: flex;
  justify-content: flex-end;
`;

Styled.Toolbar = styled(Toolbar)<{ $numChildren: number }>`
  ${({ $numChildren }) =>
    $numChildren &&
    css`
      width: calc(${$numChildren} * 2rem + (${$numChildren} - 1) * 0.5rem);
    `}

  display: flex;
  justify-content: flex-end;
  padding: 0;

  > *:not(:last-child) {
    margin-right: 0.5rem;
  }
`;
