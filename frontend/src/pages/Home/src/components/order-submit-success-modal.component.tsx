import type { FC } from 'react';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import type { OrderEntryFormModel } from '@/modules/order-entry-form/src/models';

type OrderSubmitSuccessModalProps = {
  open: boolean;
  onOpenChange: (nextValue: boolean) => void;
  formData: OrderEntryFormModel | null;
};

export const OrderSubmitSuccessModal: FC<OrderSubmitSuccessModalProps> = ({
  onOpenChange,
  open,
  formData,
}) => (
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Content maxWidth="450px">
      <AlertDialog.Title>Order Submitted Successfully!</AlertDialog.Title>
      <AlertDialog.Description size="2">
        Yeah, good stuff! Here's your form data, do with it whatever you want:
      </AlertDialog.Description>
      {formData && (
        <Flex direction="column" gap="2" mt="3">
          <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
            <div><strong>Order Mode:</strong> {formData.orderMode}</div>
            <div><strong>Execution Type:</strong> {formData.orderExecutionType}</div>
            <div><strong>Side:</strong> {formData.orderSide}</div>
            <div><strong>Position Size:</strong> {formData.positionSize}</div>
            <div><strong>Price:</strong> {formData.price}</div>
            {formData.triggerPrice && (
              <div><strong>Trigger Price:</strong> {formData.triggerPrice}</div>
            )}
          </div>
        </Flex>
      )}
      <Flex gap="3" mt="4" justify="end">
        <AlertDialog.Cancel>
          <Button variant="soft" color="green">
            Nice!
          </Button>
        </AlertDialog.Cancel>
      </Flex>
    </AlertDialog.Content>
  </AlertDialog.Root>
);
