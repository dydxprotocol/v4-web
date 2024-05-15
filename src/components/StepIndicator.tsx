import styled, { css, type AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  currentStepIndex: number;
  totalSteps: number;
};

type StyleProps = {
  className?: string;
};

export type StepIndicatorProps = ElementProps & StyleProps;

export const StepIndicator = ({ className, currentStepIndex, totalSteps }: StepIndicatorProps) => (
  <$StepIndicator
    className={className}
    progress={((currentStepIndex - 1) / (totalSteps - 1)) * 100}
  >
    {[...Array(totalSteps)].map((_, i) => (
      <$Step key={i} isActive={i === currentStepIndex - 1} isFilled={i <= currentStepIndex - 1} />
    ))}
  </$StepIndicator>
);
const $StepIndicator = styled.div<{ progress: number }>`
  --stepIndicator-line-backgroundColor: var(--color-layer-4);
  --stepIndicator-step-backgroundColor: var(--color-layer-4);
  --stepIndicator-active-step-boxShadowColor: hsla(240, 32%, 21%, 1);
  --stepIndicator-progress: 0;

  ${({ progress }) => css`
    --stepIndicator-progress: ${progress}%;
  `}

  ${layoutMixins.inlineRow}
  gap: 0.75em;
  position: relative;
  align-self: center;
  isolation: isolate;

  &:before {
    content: '';
    width: 100%;
    height: 0.125rem;
    background-color: var(--stepIndicator-line-backgroundColor);
    position: absolute;
    z-index: -1;
  }

  &:after {
    content: '';
    width: var(--stepIndicator-progress);
    height: 0.125rem;
    background-color: var(--color-accent);
    position: absolute;
    z-index: -1;
  }
`;

const $Step = styled.div<{ isActive?: boolean; isFilled?: boolean }>`
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  color: var(--stepIndicator-step-backgroundColor);
  background-color: currentColor;

  ${({ isFilled }) =>
    isFilled &&
    css`
      --stepIndicator-step-backgroundColor: var(--color-accent);
    `}

  ${({ isActive }) =>
    isActive &&
    css`
      box-shadow: 0 0 0 0.25rem var(--stepIndicator-active-step-boxShadowColor);
    `}
`;
