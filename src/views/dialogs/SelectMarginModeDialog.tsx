import { Dialog } from '@/components/Dialog';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const SelectMarginModeDialog = ({ setIsOpen }: ElementProps) => {
  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Select Margin Mode">
      <div>Adjust Leverage</div>
    </Dialog>
  );
};
