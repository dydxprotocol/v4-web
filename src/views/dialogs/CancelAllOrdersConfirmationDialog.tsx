import { useCallback, useState } from 'react';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { CancelAllOrdersConfirmationDialogProps, DialogProps } from '@/constants/dialogs';
import { CANCEL_ALL_ORDERS_KEY } from '@/constants/trade';

import { useSubaccount } from '@/hooks/useSubaccount';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { RadioGroup } from '@/components/RadioGroup';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

export const CancelAllOrdersConfirmationDialog = ({
  setIsOpen,
  marketId,
}: DialogProps<CancelAllOrdersConfirmationDialogProps>) => {
  const { cancelAllOrders } = useSubaccount();
  const [cancelOption, setCancelOption] = useState(marketId ?? CANCEL_ALL_ORDERS_KEY);
  const currentMarketId = useAppSelector(getCurrentMarketId);
  const marketIdOption = marketId ?? currentMarketId;

  const onSubmit = useCallback(() => {
    if (cancelOption === CANCEL_ALL_ORDERS_KEY) {
      cancelAllOrders();
    } else {
      cancelAllOrders(marketIdOption);
    }

    setIsOpen?.(false);
  }, [cancelAllOrders, cancelOption, marketIdOption, setIsOpen]);

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Confirm cancel all orders">
      <form onSubmit={onSubmit} tw="flex flex-col gap-0.75">
        <div>Are you sure you want to cancel all of your orders?</div>
        {marketIdOption && (
          <RadioGroup
            items={[
              {
                value: CANCEL_ALL_ORDERS_KEY,
                label: 'All markets',
              },
              {
                value: marketIdOption,
                label: `Only ${marketIdOption}`,
              },
            ]}
            value={cancelOption}
            onValueChange={setCancelOption}
          />
        )}
        <Button action={ButtonAction.Destroy} type={ButtonType.Submit} tw="w-full">
          Cancel all orders
        </Button>
      </form>
    </Dialog>
  );
};
