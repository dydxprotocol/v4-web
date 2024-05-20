import { Root, Thumb } from '@radix-ui/react-switch';
import styled from 'styled-components';

type ElementProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
};

type StyleProps = {
  className?: string;
};

export const Switch = ({
  checked,
  className,
  disabled,
  name,
  onCheckedChange,
  required,
  value,
}: ElementProps & StyleProps) => (
  <$Root
    checked={checked}
    className={className}
    disabled={disabled}
    id={name}
    onCheckedChange={onCheckedChange}
    name={name}
    required={required}
    value={value}
  >
    <$Thumb />
  </$Root>
);
const $Root = styled(Root)`
  --switch-width: 2.625em;
  --switch-height: 1.5em;
  --switch-backgroundColor: var(--color-layer-0);
  --switch-thumb-backgroundColor: var(--color-layer-6);

  --switch-active-backgroundColor: var(--color-accent);
  --switch-active-thumb-backgroundColor: var(--color-white);

  position: relative;
  width: var(--switch-width);
  height: var(--switch-height);

  background-color: var(--switch-backgroundColor);
  border-radius: 100vmax;
  transition: none;
  -webkit-tap-highlight-color: var(--color-layer-0);

  &:disabled {
    opacity: 0.75;
  }

  &[data-state='checked'] {
    background-color: var(--switch-active-backgroundColor);
  }
`;

const $Thumb = styled(Thumb)`
  width: calc(var(--switch-width) / 2);
  height: calc(var(--switch-height) - 0.1875em);

  display: block;

  background-color: var(--switch-thumb-backgroundColor);
  border-radius: 50%;

  transform: translateX(0.125em);

  will-change: transform;
  transition: transform 100ms;

  &[data-state='checked'] {
    transform: translateX(calc((var(--switch-width) / 2) - 0.125em));
    background-color: var(--switch-active-thumb-backgroundColor);
  }
`;
