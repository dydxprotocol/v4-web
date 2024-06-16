import { type SubaccountOrder } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';

import { useAppDispatch } from '@/state/appTypes';

type ElementProps = {
  marketId: string;
  assetId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  setIsOpen: (open: boolean) => void;
};

export const SharePNLAnalyticsDialog = ({
  marketId,
  assetId,
  stopLossOrders,
  takeProfitOrders,
  setIsOpen,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.SHARE_ACTIVITY })}
    />
  );
};
