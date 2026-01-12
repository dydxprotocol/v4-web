import type { ReactNode } from 'react';
import { CheckCircledIcon, CrossCircledIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { propify } from '@/lib/propify';

type OrderFormDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  icon: ReactNode;
  showCloseButton?: boolean;
};

function OrderFormDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  showCloseButton = true,
}: OrderFormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            {icon}
            <Text>{title}</Text>
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mt="2">
          {description}
        </Dialog.Description>
        {showCloseButton && (
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft">Close</Button>
            </Dialog.Close>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

export const ValidationErrorDialog = propify(OrderFormDialog, {
  title: 'Invalid Form',
  description: 'Please fill out all fields correctly before submitting.',
  icon: <CrossCircledIcon width="20" height="20" color="red" />,
  showCloseButton: true,
});

export const ProcessingTransactionDialog = propify(OrderFormDialog, {
  title: 'Processing Transaction',
  description: 'Your transaction is being submitted to the blockchain. Please wait...',
  icon: <InfoCircledIcon width="20" height="20" />,
  showCloseButton: false,
});

export const TransactionSuccessDialog = propify(OrderFormDialog, {
  title: 'Transaction Successful',
  description: 'Your order has been submitted successfully!',
  icon: <CheckCircledIcon width="20" height="20" color="green" />,
  showCloseButton: true,
});

export const TransactionErrorDialog = propify(OrderFormDialog, {
  title: 'Transaction Failed',
  icon: <CrossCircledIcon width="20" height="20" color="red" />,
  showCloseButton: true,
});
