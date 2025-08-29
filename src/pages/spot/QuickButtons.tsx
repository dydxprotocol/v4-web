import { useEffect, useState } from 'react';

import { NumericFormat } from 'react-number-format';
import styled, { css } from 'styled-components';

import { Icon, IconName } from '@/components/Icon';

type QuickButtonProps = {
  options: string[];
  onSelect?: (value: string) => void;
  onOptionsEdit?: (options: string[]) => void;
  currentValue?: string;
  disabled?: boolean;
};

export const QuickButtons = ({
  options,
  onSelect,
  onOptionsEdit,
  currentValue,
  disabled,
}: QuickButtonProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<string[]>(options);

  const handleEdit = () => {
    setEditValues(options.map((o) => o.toString()));
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    const uniqueValues = editValues.map((value, i) => {
      const isUnique = !options.includes(value) || options.indexOf(value) === i;
      const isValid = !Number.isNaN(parseFloat(value));

      if (isUnique && isValid) {
        return value;
      }

      return options[i]!;
    });

    onOptionsEdit?.(uniqueValues);
    setIsEditing(false);
  };

  useEffect(() => {
    setEditValues(options);
  }, [options]);

  const handleInputChange = (index: number, value: string) => {
    const newEditValues = [...editValues];
    newEditValues[index] = value;
    setEditValues(newEditValues);
  };

  return (
    <$QuickButtonsContainer>
      {options.map((option, i) =>
        isEditing ? (
          <$InputQuickButtonContainer key={option}>
            <$QuickButtonInput
              allowNegative={false}
              decimalScale={2}
              disabled={disabled}
              value={editValues[i]}
              onChange={(e) => handleInputChange(i, e.target.value)}
            />
          </$InputQuickButtonContainer>
        ) : (
          <$QuickButtonContainer
            key={option}
            onClick={() => onSelect?.(option)}
            type="button"
            isSelected={currentValue === option}
            disabled={disabled}
          >
            <span tw="truncate">{option}</span>
          </$QuickButtonContainer>
        )
      )}
      <$QuickButtonContainer
        aria-label={isEditing ? 'Confirm' : 'Edit'}
        type="button"
        onClick={isEditing ? handleConfirmEdit : handleEdit}
        disabled={disabled}
      >
        <Icon iconName={isEditing ? IconName.Check : IconName.Pencil2} size="1rem" />
      </$QuickButtonContainer>
    </$QuickButtonsContainer>
  );
};

const $QuickButtonInput = styled(NumericFormat)`
  outline: 0;
  border: 0;
  min-width: 0;
  background-color: transparent;
  text-align: center;
`;

const $QuickButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 2.3125rem;
  gap: 0.75rem;

  & > *:not(:last-child) {
    flex: 1;
  }

  & > *:last-child {
    aspect-ratio: 1;
    flex-shrink: 0;
  }
`;

const QuickButtonContainerStyles = css`
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 100%;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid var(--color-layer-4);
  padding: 0 0.5rem;
  font: var(--font-base-medium);
  color: var(--color-text);
  min-width: 0;

  @media (prefers-reduced-motion: no-preference) {
    transition: 0.3s var(--ease-out-expo);
  }
`;

const $InputQuickButtonContainer = styled.div`
  ${QuickButtonContainerStyles}

  background-color: var(--color-layer-3);

  &:focus-within {
    background-color: var(--color-layer-4);
  }
`;

const $QuickButtonContainer = styled.button<{ isSelected?: boolean }>`
  ${QuickButtonContainerStyles}

  ${({ isSelected }) =>
    isSelected &&
    css`
      background-color: var(--color-layer-4);
    `}

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-layer-3);
    }
  }
`;
