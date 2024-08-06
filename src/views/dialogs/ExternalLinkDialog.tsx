import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogProps, ExternalLinkDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

export const ExternalLinkDialog = ({
  setIsOpen,
  buttonText,
  link,
  linkDescription,
  title,
  slotContent,
}: DialogProps<ExternalLinkDialogProps>) => {
  const stringGetter = useStringGetter();
  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={title ?? stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE })}
      description={
        linkDescription ?? stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE_DESCRIPTION })
      }
    >
      <div tw="flexColumn gap-1 font-base-book">
        {slotContent}
        <p>{stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE_DISCLAIMER })}.</p>
        <Button type={ButtonType.Link} action={ButtonAction.Primary} href={link}>
          {buttonText ?? stringGetter({ key: STRING_KEYS.CONTINUE })}
        </Button>
      </div>
    </Dialog>
  );
};
