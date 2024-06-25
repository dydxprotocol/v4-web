import styled, { css } from 'styled-components';

import { DialogProps, MobileDownloadDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { QrCode } from '@/components/QrCode';

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
