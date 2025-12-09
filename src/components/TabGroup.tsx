import React, { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

export interface TabOption<T> {
  label: React.ReactNode;
  value: T;
  disabled?: boolean;
}

interface TabGroupProps<T> {
  value: T;
  onTabChange: (value: T) => void;
  options: TabOption<T>[];
  className?: string;
}

export const TabGroup = <T,>({ value, onTabChange, options, className }: TabGroupProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const hasRendered = useRef(false);

  // Side effect to animate the active tab indicator when value changes
  useEffect(() => {
    if (containerRef.current && activeTabRef.current) {
      const container = containerRef.current;
      const activeTab = activeTabRef.current;

      const selectedTabElement = container.querySelector(`[data-value="${value}"]`);

      if (selectedTabElement) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = selectedTabElement.getBoundingClientRect();

        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;

        // Only prevent animation on the very first render
        if (hasRendered.current) {
          activeTab.style.transform = `translateX(${left}px)`;
          activeTab.style.width = `${width}px`;
        } else {
          hasRendered.current = true;
          activeTab.style.transition = 'none';
          activeTab.style.transform = `translateX(${left}px)`;
          activeTab.style.width = `${width}px`;
          activeTab.getBoundingClientRect();
          activeTab.style.transition = '';
        }
      }
    }
  }, [value]);

  return (
    <$Container ref={containerRef} className={className}>
      <$ActiveTabIndicator ref={activeTabRef} />
      {options.map((option) => {
        const isText = typeof option.label === 'string' || typeof option.label === 'number';

        return (
          <$Tab
            disabled={option.disabled}
            key={String(option.value)}
            data-value={option.value}
            onClick={() => onTabChange(option.value)}
            $isActive={option.value === value}
          >
            {isText ? <$TextItem>{option.label}</$TextItem> : option.label}
          </$Tab>
        );
      })}
    </$Container>
  );
};

const $Container = styled.div`
  position: relative;
  display: flex;
  background: var(--color-layer-2);
  border-radius: 0.625rem;
  padding: var(--tab-group-padding, 3px);
  gap: 0;
`;

const $ActiveTabIndicator = styled.div`
  position: absolute;
  top: var(--tab-group-padding, 3px);
  left: 0;
  height: calc(100% - calc(var(--tab-group-padding, 3px) * 2));
  background: var(--color-layer-3);
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  pointer-events: none;
  z-index: 1;
`;

const $Tab = styled.button<{ $isActive: boolean }>`
  position: relative;
  z-index: 2;
  flex: 1;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  height: var(--tab-group-height, 3rem);
  color: ${({ $isActive }) => ($isActive ? 'var(--color-text-2)' : 'var(--color-text-0)')};
  cursor: pointer;
  transition: color 0.2s ease-in-out;
  white-space: nowrap;
  min-width: 0;
  font-size: 1rem;
  font-weight: var(--fontWeight-medium);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-text-1);
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
  }
`;

const $TextItem = styled.span`
  ${layoutMixins.textTruncate}
`;
