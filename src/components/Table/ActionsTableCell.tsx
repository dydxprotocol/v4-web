import React from 'react';

import styled, { css } from 'styled-components';

import { Toolbar } from '@/components/Toolbar';

type ElementProps = {
  children: React.ReactNode;
};

type StyleProps = {
  className?: string;
};

export const ActionsTableCell = ({ children, className }: ElementProps & StyleProps) => (
  <div tw="flex justify-end">
    <$Toolbar className={className} $numChildren={React.Children.toArray(children).length}>
      {children}
    </$Toolbar>
  </div>
);
const $Toolbar = styled(Toolbar)<{ $numChildren: number }>`
  ${({ $numChildren }) =>
    $numChildren &&
    css`
      width: calc(${$numChildren} * 2rem + (${$numChildren} - 1) * 0.5rem);
    `}

  --toolbar-margin: 0.5rem;

  display: flex;
  justify-content: flex-end;
  padding: 0;

  > *:not(:last-child) {
    margin-right: var(--toolbar-margin);
  }
`;
