import styled, { type AnyStyledComponent } from 'styled-components';

import { breakpoints } from '@/styles';

type ElementProps = {
  checked: boolean;
  onClick: (e: React.ChangeEvent) => void;
};

type StyleProps = {
  className?: string;
};

export type CheckboxProps = ElementProps & StyleProps;

export const Checkbox: React.FC<CheckboxProps> = ({ checked, className, onClick }) => {
  return (
    <Styled.CheckboxWrapper className={className}>
      <Styled.Checkbox
        type="checkbox"
        checked={checked}
        onChange={onClick}
      />
      <Styled.CustomCheckbox />
    </Styled.CheckboxWrapper>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.CustomCheckbox = styled.span`
  width: 1.25em;
  height: 1.25em;

  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: var(--checkbox-backgroundColor);

  &::after {
    position: absolute;
    content: '';
    top: 0.25em;
    left: 0.4375em;
    width: 0.3125em;
    height: 0.5em;
    border: solid var(--checkbox-checkColor);
    border-width: 0 0.125em 0.125em 0;
    border-radius: 0.0625em;
    opacity: 0;
    transform: rotate(0deg) scale(0);
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
  }

  @media ${breakpoints.tablet} {
    width: 1.5em;
    height: 1.5em;

    &::after {
      top: 0.25em;
      left: 0.4375em;
      width: 0.4375em;
      height: 0.625em;
    }
  }
`;

Styled.CheckboxWrapper = styled.div`
  --checkbox-backgroundColor: var(--color-layer-1);
  --checkbox-checkColor: var(--color-text-1);

  display: flex;
  border-radius: 0.25em;
  overflow: hidden;
  position: relative;
  cursor: pointer;

  > input:checked ~ ${Styled.CustomCheckbox}::after {
    opacity: 1;
    transform: rotate(40deg) scale(1);
  }
`;

Styled.Checkbox = styled.input`
  width: 1.25em;
  height: 1.25em;
  z-index: 1;
  cursor: pointer;
  opacity: 0;

  @media ${breakpoints.tablet} {
    width: 1.5em;
    height: 1.5em;
  }
`;
