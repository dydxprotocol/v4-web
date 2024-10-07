import { DialogProps, NewMarketAgreementDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';

import { NewMarketAgreement } from '../forms/NewMarketForm/NewMarketAgreement';

export const NewMarketAgreementDialog = ({
  acceptTerms,
  setIsOpen,
}: DialogProps<NewMarketAgreementDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.ACKNOWLEDGEMENT })}
      tw="notMobile:[--dialog-width:30rem]"
    >
      <NewMarketAgreement
        onAccept={() => {
          acceptTerms();
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </Dialog>
  );
};
