import React from 'react';

import styled, { css } from 'styled-components';

import { Toolbar } from '@/components/Toolbar';

type ElementProps = {
  children: React.ReactNode;
};

export const ActionsTableCell = ({ children }: ElementProps) => (
  <$ActionsCell>
    <$Toolbar $numChildren={React.Children.toArray(children).length}>{children}</$Toolbar>
  </$ActionsCell>
);
const $ActionsCell = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const $Toolbar = styled(Toolbar)<{ $numChildren: number }>`
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
