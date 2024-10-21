import type { ReactNode } from 'react';

import { Arrow, Content, Portal, Provider, Root, Trigger } from '@radix-ui/react-tooltip';
import styled from 'styled-components';

import { STRING_KEYS, TooltipStrings } from '@/constants/localization';
import { TooltipStringKeys, tooltipStrings } from '@/constants/tooltips';

import { useAllStatsigGateValues } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';

type ElementProps = {
  tooltip?: TooltipStringKeys;
  tooltipString?: string;
  tooltipStringTitle?: string;
  stringParams?: Record<string, string | undefined>;
  withIcon?: boolean;
  children?: ReactNode;
  slotTooltip?: ReactNode;
  slotTrigger?: ReactNode;
};

type StyleProps = {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
};

export const WithTooltip = ({
  tooltip,
  tooltipString,
  tooltipStringTitle,
  slotTrigger,
  stringParams,
  withIcon,
  children,
  align,
  side,
  sideOffset,
  className,
  slotTooltip,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const urlConfigs = useURLConfigs();
  const featureFlags = useAllStatsigGateValues();

  const getTooltipStrings: TooltipStrings[string] | undefined = tooltip && tooltipStrings[tooltip];
  if (!getTooltipStrings && !tooltipString && !slotTooltip && !tooltipStringTitle) return children;

  let tooltipTitle;
  let tooltipBody;
  let tooltipLearnMore;

  if (getTooltipStrings) {
    const { title, body, learnMoreLink } = getTooltipStrings({
      stringGetter,
      stringParams,
      urlConfigs,
      featureFlags,
    });
    tooltipTitle = title;
    tooltipBody = body;
    tooltipLearnMore = learnMoreLink;
  } else {
    tooltipBody = tooltipString;
    tooltipTitle = tooltipStringTitle;
  }

  return (
    <Provider>
      <Root delayDuration={300}>
        <Trigger asChild>
          {slotTrigger ?? (
            <$Abbr>
              {children}
              {withIcon && <Icon iconName={IconName.HelpCircle} tw="text-color-text-0" />}
            </$Abbr>
          )}
        </Trigger>

        <Portal>
          <$Content
            sideOffset={sideOffset ?? 8}
            side={side}
            align={align}
            className={className}
            asChild
          >
            {slotTooltip ?? (
              <dl>
                {tooltipTitle && <dt>{tooltipTitle}</dt>}
                {tooltipBody && <dd>{tooltipBody}</dd>}
                {tooltipLearnMore && (
                  <dd>
                    <Link href={tooltipLearnMore} isAccent>
                      {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                    </Link>
                  </dd>
                )}
                <$Arrow />
              </dl>
            )}
          </$Content>
        </Portal>
      </Root>
    </Provider>
  );
};

const $Abbr = styled.abbr`
  ${layoutMixins.inlineRow}

  text-decoration: underline dashed 0px;
  text-underline-position: under;
  text-decoration-color: var(--color-text-0);
  text-decoration-skip-ink: all;

  cursor: help;
`;

const $Content = styled(Content)`
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

  a {
    text-decoration: underline;
  }
`;

const $Arrow = styled(Arrow)`
  width: 0.75rem;
  height: 0.375rem;

  polygon {
    fill: var(--tooltip-backgroundColor);
  }
`;
