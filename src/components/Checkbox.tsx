import { Indicator, Root } from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  label?: React.ReactNode;
  disabled?: boolean;
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
  disabled,
}) => (
  <Styled.Container>
    <Styled.Root
      className={className}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      id={id}
    >
      <Styled.Indicator>
        <CheckIcon />
      </Styled.Indicator>
    </Styled.Root>
    {label && (
      <Styled.Label disabled={disabled} htmlFor={id}>
        {label}
      </Styled.Label>
    )}
  </Styled.Container>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  ${layoutMixins.row}
  gap: 1ch;
  font: var(--font-small-book);
`;

Styled.Root = styled(Root)`
  --checkbox-backgroundColor: var(--color-layer-0);
  --checkbox-borderColor: var(--color-border);

  min-width: 1.25rem;
  height: 1.25rem;

  border-radius: 0.375rem;
  border: var(--border-width) solid var(--checkbox-borderColor);
  background-color: var(--checkbox-backgroundColor);

  &[data-state='checked'] {
    --checkbox-backgroundColor: var(--color-accent);
  }

  &[data-disabled] {
    cursor: not-allowed;
    --checkbox-backgroundColor: var(--color-layer-1);
  }
`;

Styled.Indicator = styled(Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;

  color: var(--color-text-button);
`;

Styled.Label = styled.label<{ disabled?: boolean }>`
  cursor: pointer;
  color: var(--color-text-2);

  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      color: var(--color-text-0);
    `}
`;
