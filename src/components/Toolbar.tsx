import styled, { type AnyStyledComponent } from 'styled-components';

import { Root, Button, Separator, Link, ToggleGroup, ToggleItem } from '@radix-ui/react-toolbar';
import { WithSeparators } from './Separator';
import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  children: React.ReactNode;
};

type StyleProps = {
  layout?: 'column' | 'row';
  className?: string;
  withSeparators?: boolean;
};

export const Toolbar = ({
  children,
  layout = 'row',
  withSeparators = false,
  className,
}: ElementProps & StyleProps) => (
  <Styled.Root className={className} layout={layout}>
    <WithSeparators layout={layout} withSeparators={withSeparators}>
      {children}

      {/* Each child as a <Toolbar.Button> */}
      {/* {[children].flat().map((child, i) => (
        <Button
          asChild
          key={i}
        >
          {child}
        </Button>
      ))} */}
    </WithSeparators>
  </Styled.Root>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Root = styled(Root)<{ layout?: 'column' | 'row' }>`
  ${({ layout }) =>
    layout &&
    {
      column: layoutMixins.column,
      row: layoutMixins.row,
    }[layout]}

  padding: 0 1rem;
`;
