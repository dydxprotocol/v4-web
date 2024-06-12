import styled, { css } from 'styled-components';

import { DialogProps, MobileDownloadDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { QrCode } from '@/components/QrCode';

/*
  When/if deployer deploys the web app with smartbanner, "smartbanner:button-url-apple" and/or 
  "smartbanner:button-url-google" <meta> are set.
  This implementation assumes "smartbanner:button-url-apple" and "smartbanner:button-url-google" 
  are set to the same value with onelink or other redirect URL.
  Since there is no way for the desktop web app to know what mobile device the user is using, 
  we should give a onelink URL which redirects to either iOS or Android app store depending on 
  the mobile device used to scan the link.
*/

// for testing only
// export const mobileAppUrl = "http://example.com";

let mobileAppUrl: string | undefined | null;

export const getMobileAppUrl = () => {
  if (!mobileAppUrl) {
    mobileAppUrl =
      // for testing to verify <meta> is retrieved by name, QR code should show "@dYdX" as value
      // document.querySelector('meta[name="twitter:creator"]')?.getAttribute('content') ??
      document
        .querySelector('meta[name="smartbanner:button-url-apple"]')
        ?.getAttribute('content') ??
      document.querySelector('meta[name="smartbanner:button-url-google"]')?.getAttribute('content');
  }
  return mobileAppUrl;
};

const MobileQrCode = ({ url }: { url: string }) => {
  return (
    <$QrCodeContainer isShowing>
      <QrCode hasLogo size={432} value={url} />
    </$QrCodeContainer>
  );
};

/*
MobileDownloadDialog should only been shown on desktop when mobileAppUrl has value. That's controlled by AccountMenu.tsx.
*/

export const MobileDownloadDialog = ({ setIsOpen }: DialogProps<MobileDownloadDialogProps>) => {
  const stringGetter = useStringGetter();
  const content = <MobileQrCode url={mobileAppUrl!} />;

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DOWNLOAD_MOBILE_APP })}
    >
      <$Content>{content}</$Content>
    </Dialog>
  );
};
const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;

  strong {
    font-weight: 900;
    color: var(--color-text-2);
  }

  footer {
    ${layoutMixins.row}
    justify-content: space-between;

    svg {
      width: auto;
    }
  }
`;

const $QrCodeContainer = styled.figure<{ isShowing: boolean }>`
  ${layoutMixins.stack}

  overflow: hidden;
  border-radius: 0.75em;

  cursor: pointer;

  transition: 0.2s;

  &:hover {
    filter: brightness(var(--hover-filter-base));
  }

  > * {
    position: relative;
    transition: 0.16s;
  }

  > :first-child {
    pointer-events: none;

    ${({ isShowing }) =>
      !isShowing &&
      css`
        filter: blur(1rem) brightness(1.4);
        will-change: filter;
      `}
  }

  > span {
    place-self: center;

    font-size: 1.4em;
    color: var(--color-text-2);

    ${({ isShowing }) =>
      isShowing &&
      css`
        opacity: 0;
      `}
  }
`;
