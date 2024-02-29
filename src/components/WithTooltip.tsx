import type { ReactNode } from 'react';

import { Content, Portal, Provider, Root, Trigger, Arrow } from '@radix-ui/react-tooltip';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { tooltipStrings } from '@/constants/tooltips';

import { useStringGetter, useURLConfigs } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';

type ElementProps = {
  tooltip?: keyof typeof tooltipStrings;
  tooltipString?: string;
  stringParams?: Record<string, string>;
  withIcon?: boolean;
  children?: ReactNode;
  slotTooltip?: ReactNode;
};

type StyleProps = {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
};

export const WithTooltip = ({
  tooltip,
  tooltipString,
  stringParams,
  withIcon,
  children,
  align,
  side,
  className,
  slotTooltip,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const urlConfigs = useURLConfigs();

  const getTooltipStrings = tooltip && tooltipStrings[tooltip];
  if (!getTooltipStrings && !tooltipString && !slotTooltip) return <>{children}</>;

  let tooltipTitle;
  let tooltipBody;
  let tooltipLearnMore;

  if (getTooltipStrings) {
    const { title, body, learnMoreLink } = getTooltipStrings({
      stringGetter,
      stringParams,
      urlConfigs,
    });
    tooltipTitle = title;
    tooltipBody = body;
    tooltipLearnMore = learnMoreLink;
  } else {
    tooltipBody = tooltipString;
  }

  return (
    <Provider>
      <Root delayDuration={300}>
        <Trigger asChild>
          <Styled.Abbr>
            {children}
            {withIcon && <Styled.Icon iconName={IconName.HelpCircle} />}
          </Styled.Abbr>
        </Trigger>

        <Portal>
          <Styled.Content sideOffset={8} side={side} align={align} className={className} asChild>
            {slotTooltip ?? (
              <dl>
                {tooltipTitle && <dt>{tooltipTitle}</dt>}
                {tooltipBody && <dd>{tooltipBody}</dd>}
                {tooltipLearnMore && (
                  <dd>
                    <Styled.LearnMore href={tooltipLearnMore}>
                      {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                    </Styled.LearnMore>
                  </dd>
                )}
                <Styled.Arrow />
              </dl>
            )}
          </Styled.Content>
        </Portal>
      </Root>
    </Provider>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Abbr = styled.abbr`
  ${layoutMixins.inlineRow}

  text-decoration: underline dashed 0px;
  text-underline-position: under;
  text-decoration-color: var(--color-text-0);
  text-decoration-skip-ink: all;

  cursor: help;
`;

Styled.Content = styled(Content)`
  --tooltip-backgroundColor: var(--color-layer-4);
  --tooltip-backgroundColor: ${({ theme }) => theme.tooltipBackground};

  ${popoverMixins.popover}
  --popover-backgroundColor: var(--tooltip-backgroundColor);
  --popover-textColor: var(--color-text-1);

  ${popoverMixins.popoverAnimation}
  --popover-closed-height: auto;

  max-width: 30ch;
  display: grid;
  align-items: end;
  gap: 0.25rem;
  padding: 0.75em;

  font-size: 0.8125em;

  border-radius: 0.33em;

  dt {
    font: var(--font-small-book);
  }

  dd {
    font: var(--font-mini-book);
  }
`;

Styled.Arrow = styled(Arrow)`
  width: 0.75rem;
  height: 0.375rem;

  polygon {
    fill: var(--tooltip-backgroundColor);
  }
`;

Styled.Icon = styled(Icon)`
  color: var(--color-text-0);
`;

Styled.LearnMore = styled(Link)`
  --link-color: var(--color-accent);
`;
