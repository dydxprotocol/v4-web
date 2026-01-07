import * as Tabs from '@radix-ui/react-tabs';
import { useController } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext } from '../contexts';
import { ORDER_SIDES } from '../models';
import * as styles from './order-side-switch.css';

export function OrderSideSwitch() {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { field } = useController({ control, name: 'orderSide' });

  return (
    <Tabs.Root value={field.value} onValueChange={field.onChange}>
      <Tabs.List css={styles.tabsList}>
        {ORDER_SIDES.map((side) => (
          <Tabs.Trigger key={side} value={side} css={styles.tabsTrigger} data-side={side}>
            {side.charAt(0).toUpperCase() + side.slice(1)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
