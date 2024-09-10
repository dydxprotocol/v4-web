import { DialogProps, LaunchMarketDialogProps } from '@/constants/dialogs';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { NewMarketForm } from '../forms/NewMarketForm';

export const LaunchMarketDialog = ({ setIsOpen }: DialogProps<LaunchMarketDialogProps>) => {
  const { isMobile } = useBreakpoints();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <NewMarketForm />
    </Dialog>
  );
};
