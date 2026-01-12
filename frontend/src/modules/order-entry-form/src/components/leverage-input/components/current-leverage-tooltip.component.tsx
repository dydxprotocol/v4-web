import { type PropsWithChildren, memo } from 'react';
import { Tooltip } from 'radix-ui';
import { useWatch } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext } from '../../../contexts';
import * as styles from './current-leverage-tooltip.css';

interface CurrentLeverageTooltipProps extends PropsWithChildren {}

export const CurrentLeverageTooltip = memo(({ children }: CurrentLeverageTooltipProps) => {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const leverage = useWatch({ control, name: 'leverage' });

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root open>
        {children}
        <Tooltip.Portal>
          <Tooltip.Content css={styles.tooltipContent} sideOffset={5}>
            {leverage}x
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});

CurrentLeverageTooltip.displayName = 'CurrentLeverageTooltip';
