import { useEffect } from 'react';

import { DepositDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useFunkitBuyNobleUsdc } from '@/hooks/useFunkitBuyNobleUsdc';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

import { DepositDialogContent } from './DepositDialog/DepositDialogContent';

enum DepositType {
  FUNKIT = 'funkit',
  STANDARD = 'standard',
}

export const DepositDialog = ({
  setIsOpen,
  depositType = DepositType.FUNKIT,
}: DialogProps<DepositDialogProps>) => {
  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();
  const startCheckout = useFunkitBuyNobleUsdc();
  const dispatch = useAppDispatch();
  const ffEnableFunkit = useStatsigGateValue(StatsigFlags.ffEnableFunkit);

  useEffect(() => {
    if (depositType === DepositType.FUNKIT && ffEnableFunkit) {
      dispatch(closeDialog());
      startCheckout();
    }
  }, [depositType, dispatch, startCheckout, ffEnableFunkit]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <DepositDialogContent />
    </Dialog>
  );
};
