import { useCallback, useState } from 'react';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { CancelAllOrdersConfirmationDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { CANCEL_ALL_ORDERS_KEY } from '@/constants/trade';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { RadioGroup } from '@/components/RadioGroup';

import {
  calculateHasCancelableOrders,
  calculateHasCancelableOrdersInOtherMarkets,
} from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

export const CancelAllOrdersConfirmationDialog = ({
  setIsOpen,
  marketId,
}: DialogProps<CancelAllOrdersConfirmationDialogProps>) => {
  const stringGetter = useStringGetter();
  const { cancelAllOrders } = useSubaccount();
  const [cancelOption, setCancelOption] = useState(marketId ?? CANCEL_ALL_ORDERS_KEY);
  const currentMarketId = useAppSelector(getCurrentMarketId);
  const marketIdOption = marketId ?? currentMarketId;

  const hasCancelableOrdersInOtherMarkets = useAppSelector(
    calculateHasCancelableOrdersInOtherMarkets
  );
  const hasCancelableOrdersInCurrentMarket = useParameterizedSelector(
    calculateHasCancelableOrders,
    currentMarketId
  );

  const shouldShowOptions =
    marketIdOption && hasCancelableOrdersInOtherMarkets && hasCancelableOrdersInCurrentMarket;
  const shouldCancelAllOrders = cancelOption === CANCEL_ALL_ORDERS_KEY || !shouldShowOptions;

  const onSubmit = useCallback(() => {
    cancelAllOrders(shouldCancelAllOrders ? undefined : marketIdOption);
    setIsOpen(false);
  }, [cancelAllOrders, marketIdOption, setIsOpen, shouldCancelAllOrders]);

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.CONFIRM })}>
      <form onSubmit={onSubmit} tw="flex flex-col gap-0.75">
        <div>{stringGetter({ key: STRING_KEYS.CANCEL_ALL_ORDERS_CONFIRMATION })}</div>
        {shouldShowOptions && (
          <RadioGroup
            items={[
              {
                value: CANCEL_ALL_ORDERS_KEY,
                label: stringGetter({ key: STRING_KEYS.ALL_MARKETS }),
              },
              {
                value: marketIdOption,
                label: stringGetter({
                  key: STRING_KEYS.CANCEL_ALL_ORDERS_SINGLE_MARKET_OPTION,
                  params: { MARKET_ID: marketIdOption },
                }),
              },
            ]}
            value={cancelOption}
            onValueChange={setCancelOption}
          />
        )}
        <Button action={ButtonAction.Destroy} type={ButtonType.Submit} tw="w-full">
          {stringGetter({ key: STRING_KEYS.CANCEL_ALL_ORDERS })}
        </Button>
      </form>
    </Dialog>
  );
};
