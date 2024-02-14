import styled, { AnyStyledComponent, css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { QrCode } from '@/components/QrCode';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};


const MobileQrCode = ({
  url,
}: {
  url: string;
}) => {
  return (
    <Styled.QrCodeContainer isShowing={true}>
      <QrCode hasLogo size={432} value={url} />
    </Styled.QrCodeContainer>
  );
};

export const MobileDownloadDialog = ({ setIsOpen }: ElementProps) => {
  const encryptionKey = "hello world!";

  const content = (
      <>
        <MobileQrCode
          url={encryptionKey}
        />
      </>
  );

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Scan and Download">
      <Styled.Content>{content}</Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
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

Styled.WaitingSpan = styled.span`
  strong {
    color: var(--color-warning);
  }
`;

Styled.QrCodeContainer = styled.figure<{ isShowing: boolean }>`
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
