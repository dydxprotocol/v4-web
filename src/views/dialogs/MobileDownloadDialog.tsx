import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { DialogProps, MobileDownloadDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { QrCode } from '@/components/QrCode';

const MobileQrCode = ({ url }: { url: string }) => {
  return (
    <div tw="m-auto flex items-center">
      <QrCode
        tw="rounded-0.75 border-solid border-color-border bg-color-layer-4 p-1"
        hasLogo
        value={url}
      />
    </div>
  );
};

/*
MobileDownloadDialog should only been shown on desktop when mobileAppUrl has value. That's controlled by AccountMenu.tsx.
*/

export const MobileDownloadDialog = ({
  setIsOpen,
  mobileAppUrl,
}: DialogProps<MobileDownloadDialogProps>) => {
  const stringGetter = useStringGetter();

  const content = <MobileQrCode url={mobileAppUrl} />;

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DOWNLOAD_MOBILE_APP })}
      description={stringGetter({ key: STRING_KEYS.SCAN_TO_DOWNLOAD })}
    >
      <div tw="flexColumn gap-1.5">
        {content}
        <$Footer>
          <Button tw="grow" onClick={() => setIsOpen(false)} action={ButtonAction.Primary}>
            {stringGetter({ key: STRING_KEYS.CLOSE })}
          </Button>
        </$Footer>
      </div>
    </Dialog>
  );
};

const $Footer = styled.div`
  ${formMixins.footer};
  ${layoutMixins.row}

  gap: 1rem;
`;
