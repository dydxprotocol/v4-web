import { useMemo, useState } from 'react';

import { Root, Trigger, Content, Portal } from '@radix-ui/react-popover';
import { useRect } from '@radix-ui/react-use-rect';
import styled, { type AnyStyledComponent, css, keyframes } from 'styled-components';

import { popoverMixins } from '@/styles/popoverMixins';

export enum TriggerType {
  Default = 'Default',
  SearchSelect = 'SearchSelect',
  MarketDropdown = 'MarketDropdown',
}

type ElementProps = {
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  slotTrigger: React.ReactNode;
  slotAnchor?: React.ReactNode;
  children: React.ReactNode;
};

type StyleProps = {
  className?: string;
  fullWidth?: boolean;
  noBlur?: boolean;
  sideOffset?: number;
  triggerType?: TriggerType;
  withPortal?: boolean;
};

export type PopoverProps = ElementProps & StyleProps;

export const Popover = ({
  modal = true,
  open,
  onOpenChange,
  slotTrigger,
  slotAnchor,
  sideOffset,
  fullWidth,
  noBlur,
  triggerType = TriggerType.Default,
  withPortal = false,
  className,
  children,
}: PopoverProps) => {
  const [trigger, setTrigger] = useState(null);
  const rect = useRect(trigger);
  const width = useMemo(() => fullWidth && rect?.width, undefined);

  const content = (
    <Styled.Content
      onOpenAutoFocus={(e: Event) => {
        e.preventDefault();
      }}
      style={{ width }}
      $noBlur={noBlur}
      className={className}
      sideOffset={sideOffset}
    >
      {children}
    </Styled.Content>
  );

  return (
    <Root modal={modal} open={open} onOpenChange={onOpenChange}>
      <Styled.Trigger ref={setTrigger} $noBlur={noBlur} $triggerType={triggerType}>
        {slotTrigger}
      </Styled.Trigger>
      {slotAnchor}
      {withPortal ? <Portal>{content}</Portal> : content}
    </Root>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Trigger = styled(Trigger)<{ $noBlur?: boolean; $triggerType: TriggerType }>`
  ${popoverMixins.backdropOverlay}
  ${popoverMixins.trigger}

  ${({ $triggerType }) =>
    ({
      [TriggerType.Default]: css`
        ${popoverMixins.triggerWithGrid}
      `,
      [TriggerType.SearchSelect]: popoverMixins.searchSelectTrigger,
      [TriggerType.MarketDropdown]: popoverMixins.marketDropdownTrigger,
    }[$triggerType])}

  ${({ $noBlur }) =>
    $noBlur &&
    css`
      &[data-state='open']:after {
        backdrop-filter: none;
      }
    `}

  --trigger-padding: 0;
`;

Styled.Content = styled(Content)<{ $noBlur?: boolean }>`
  ${({ $noBlur }) =>
    !$noBlur &&
    css`
      @media (prefers-reduced-motion: no-preference) {
        &[data-state='open'] {
          @media (prefers-reduced-motion: no-preference) {
            transition: var(--ease-in-expo) 0.25s;

            animation: ${keyframes`
          from {
            opacity: 0;
            filter: blur(2px);
          }
        `} 0.2s;
          }
        }

        &[data-state='closed'] {
          @media (prefers-reduced-motion: no-preference) {
            animation: ${keyframes`
          to {
            opacity: 0;
            filter: blur(2px);
          }
        `} 0.2s;
          }
        }
      }
    `}
`;
