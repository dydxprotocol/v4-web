import styled, { type AnyStyledComponent } from 'styled-components';
import { Root, Indicator } from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  label?: React.ReactNode;
};

type StyleProps = {
  className?: string;
};

export type CheckboxProps = ElementProps & StyleProps;

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  className,
  onCheckedChange,
  id,
  label,
}) => (
  <Styled.Container>
    <Styled.Root className={className} checked={checked} onCheckedChange={onCheckedChange} id={id}>
      <Styled.Indicator>
        <CheckIcon />
      </Styled.Indicator>
    </Styled.Root>
    {label && <label htmlFor={id}>{label}</label>}
  </Styled.Container>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  ${layoutMixins.row}
  gap: 1ch;
  font: var(--font-small-book);

  label {
    cursor: pointer;
  }
`;

Styled.Root = styled(Root)`
  --checkbox-backgroundColor: var(--color-layer-0);

  min-width: 1.25rem;
  height: 1.25rem;

  border-radius: 0.375rem;
  border: var(--border-width) solid var(--color-border);
  background-color: var(--checkbox-backgroundColor);

  &[data-state='checked'] {
    --checkbox-backgroundColor: var(--color-accent);
  }
`;

Styled.Indicator = styled(Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;

  color: var(--color-text-2);
`;
