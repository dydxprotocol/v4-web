import React from 'react';

import styled, { css } from 'styled-components';

import { Toolbar } from '@/components/Toolbar';

type ElementProps = {
  children: React.ReactNode;
};

export const ActionsTableCell = ({ children }: ElementProps) => (
  <div tw="flex justify-end">
    <$Toolbar $numChildren={React.Children.toArray(children).length}>{children}</$Toolbar>
  </div>
);
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
