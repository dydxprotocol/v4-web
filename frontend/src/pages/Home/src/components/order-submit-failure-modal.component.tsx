import type { FC } from 'react';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';

type OrderSubmitFailureModalProps = {
  open: boolean;
  onOpenChange: (nextValue: boolean) => void;
  errors: string[];
};

export const OrderSubmitFailureModal: FC<OrderSubmitFailureModalProps> = ({
  onOpenChange,
  open,
  errors,
}) => (
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Content maxWidth="450px">
      <AlertDialog.Title>Validation Errors</AlertDialog.Title>
      <AlertDialog.Description size="2">
        Please fix the following errors before submitting:
      </AlertDialog.Description>
      <Flex direction="column" gap="2" mt="3">
        {errors.map((error, index) => (
          <div key={index} style={{ fontSize: '14px', color: 'var(--red-11)' }}>
            • {error}
          </div>
        ))}
      </Flex>
      <Flex gap="3" mt="4" justify="end">
        <AlertDialog.Cancel>
          <Button variant="soft" color="gray">
            OK
          </Button>
        </AlertDialog.Cancel>
      </Flex>
    </AlertDialog.Content>
  </AlertDialog.Root>
);
