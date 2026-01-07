import * as Tabs from '@radix-ui/react-tabs';
import { useController } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext } from '../contexts';
import { ORDER_EXECUTION_TYPES } from '../models';
import * as styles from './order-execution-switch.css';

export function OrderExecutionSwitch() {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { field } = useController({ control, name: 'orderExecutionType' });

  return (
    <Tabs.Root value={field.value} onValueChange={field.onChange}>
      <Tabs.List css={styles.tabsList}>
        {ORDER_EXECUTION_TYPES.map((type) => (
          <Tabs.Trigger key={type} value={type} css={styles.tabsTrigger}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
