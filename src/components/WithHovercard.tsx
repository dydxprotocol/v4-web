import type { ReactNode } from 'react';

import { Content, Portal, Root, Trigger } from '@radix-ui/react-hover-card';
import styled from 'styled-components';

import { tooltipStrings } from '@/constants/tooltips';

import { useStringGetter } from '@/hooks/useStringGetter';

import { popoverMixins } from '@/styles/popoverMixins';

type ElementProps = {
  hovercard?: keyof typeof tooltipStrings;
  stringParams?: Record<string, string | undefined>;
  slotTrigger?: ReactNode;
  slotButton?: ReactNode;
};

type StyleProps = {
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export const WithHovercard = ({
  hovercard,
  stringParams,
  slotTrigger,
  slotButton,
  className,
  align,
  side,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  const getHovercardStrings = hovercard && tooltipStrings[hovercard];

  let hovercardTitle;
  let hovercardBody;

  if (getHovercardStrings) {
    const { title, body } = getHovercardStrings({
      stringGetter,
      stringParams,
    });
    hovercardTitle = title;
    hovercardBody = body;
  }

  return (
    <Root openDelay={300}>
      {slotTrigger && <Trigger asChild>{slotTrigger}</Trigger>}
      <Portal>
        <$Content className={className} align={align} alignOffset={-16} side={side} sideOffset={8}>
          {hovercardTitle && <$Title>{hovercardTitle}</$Title>}
          {hovercardBody && <p>{hovercardBody}</p>}
          {slotButton}
        </$Content>
      </Portal>
    </Root>
  );
};
const $Content = styled(Content)`
  ${popoverMixins.popover}
  --popover-backgroundColor: var(--color-layer-6);

  ${popoverMixins.popoverAnimation}
  --popover-closed-height: auto;

  display: grid;
  max-width: 30ch;
  gap: 0.5rem;
  padding: 0.75em;

  font-size: 0.8125em;
  border-radius: 0.33rem;
`;

const $Title = styled.h3`
  font: var(--font-small-bold);
  color: var(--color-text-2);
`;
