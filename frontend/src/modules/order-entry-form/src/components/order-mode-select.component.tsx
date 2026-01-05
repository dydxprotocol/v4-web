import { Select } from 'radix-ui';
import { useController } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext } from '../contexts';
import { ORDER_MODES } from '../models';
import * as styles from './order-mode-select.css';

export function OrderModeSelect() {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { field } = useController({ control, name: 'orderMode' });

  return (
    <div css={styles.container}>
      <label css={styles.label}>Order mode:</label>
      <Select.Root value={field.value} onValueChange={field.onChange}>
        <Select.Trigger css={styles.selectTrigger}>
          <Select.Value />
          <Select.Icon css={styles.selectIcon}>▼</Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content css={styles.selectContent}>
            <Select.Viewport>
              {ORDER_MODES.map((mode) => (
                <Select.Item key={mode} value={mode} css={styles.selectItem}>
                  <Select.ItemText>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
