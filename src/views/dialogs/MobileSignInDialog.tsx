import { useMemo, useState } from 'react';
import styled, { AnyStyledComponent, css } from 'styled-components';
import { AES } from 'crypto-js';

import { AlertType } from '@/constants/alerts';
import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { useAccounts, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { TimeoutButton } from '@/components/TimeoutButton';
import { ToggleButton } from '@/components/ToggleButton';
import { QrCode } from '@/components/QrCode';
import { log } from '@/lib/telemetry';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

enum MobileSignInState {
  Waiting = 'Waiting',
  Scanning = 'Scanning',
  Connected = 'Connected',
  Failed = 'Failed',
}

const MobileQrCode = ({
  encryptionKey,
  isShowing,
  onClick,
}: {
  encryptionKey: string;
  isShowing: boolean;
  onClick: () => void;
}) => {
  const stringGetter = useStringGetter();
  const { dydxAddress, hdKey } = useAccounts();
  const { mnemonic, privateKey, publicKey } = hdKey ?? {};

  if (!mnemonic || !privateKey || !publicKey) {
    log('MobileQrCode', new Error('missing hdKey'));
    return null;
  }

  const data = {
    mnemonic,
    cosmosAddress: dydxAddress,
    pubkeyHex: Buffer.from(publicKey).toString('hex'),
    privkeyHex: Buffer.from(privateKey).toString('hex'),
  };

  const encryptedData = AES.encrypt(JSON.stringify(data), encryptionKey).toString();

  return (
    <Styled.QrCodeContainer isShowing={isShowing} onClick={onClick}>
      <QrCode hasLogo size={432} value={encryptedData} />
      <span>{stringGetter({ key: STRING_KEYS.CLICK_TO_SHOW })}</span>
    </Styled.QrCodeContainer>
  );
};

export const MobileSignInDialog = ({ setIsOpen }: ElementProps) => {
  const [currentState, setCurrentState] = useState(MobileSignInState.Waiting);
  const [isScanning, setIsScanning] = useState(false);
  const stringGetter = useStringGetter();

  // Generate a random 6 digit encryptionKey
  const encryptionKey = useMemo(() => String(Math.floor(100000 + Math.random() * 900000)), []);

  const title = {
    [MobileSignInState.Waiting]: stringGetter({ key: STRING_KEYS.TITLE_SIGN_INTO_MOBILE }),
    [MobileSignInState.Scanning]: stringGetter({ key: STRING_KEYS.TITLE_SCAN_FROM_APP }),
    [MobileSignInState.Connected]: stringGetter({ key: STRING_KEYS.TITLE_CONNECTED }),
    [MobileSignInState.Failed]: stringGetter({ key: STRING_KEYS.TITLE_FAILED_TO_CONNECT }),
  }[currentState];

  const content = {
    [MobileSignInState.Waiting]: (
      <>
        <Styled.WaitingSpan>
          <p>{stringGetter({ key: STRING_KEYS.DESCRIPTION_ABOUT_TO_TRANSFER })}</p>
          <p>
            <strong>{stringGetter({ key: STRING_KEYS.DESCRIPTION_NEVER_SHARE })} </strong>
          </p>
        </Styled.WaitingSpan>
        <TimeoutButton
          onClick={() => setCurrentState(MobileSignInState.Scanning)}
          timeoutInSeconds={8}
        >
          {stringGetter({ key: STRING_KEYS.CONTINUE })}
        </TimeoutButton>
      </>
    ),
    [MobileSignInState.Scanning]: (
      <>
        <p>
          {stringGetter({
            key: STRING_KEYS.WHILE_ONBOARDING,
            params: {
              SYNC_WITH_DESKTOP: (
                <strong>{stringGetter({ key: STRING_KEYS.SYNC_WITH_DESKTOP })}</strong>
              ),
            },
          })}
        </p>
        <span>
          Encryption Key: <strong>{encryptionKey}</strong>
        </span>
        <MobileQrCode
          encryptionKey={encryptionKey}
          isShowing={isScanning}
          onClick={() => setIsScanning(!isScanning)}
        />

        <AlertMessage type={AlertType.Warning}>
          {stringGetter({ key: STRING_KEYS.NEVER_SHARE })}
        </AlertMessage>

        <footer>
          <span>
            {stringGetter({ key: !isScanning ? STRING_KEYS.READY : STRING_KEYS.NOT_READY })}
          </span>
          <ToggleButton
            size={ButtonSize.Small}
            isPressed={isScanning}
            onPressedChange={setIsScanning}
            slotLeft={<Icon iconName={!isScanning ? IconName.Show : IconName.Hide} />}
          >
            {stringGetter({ key: !isScanning ? STRING_KEYS.SHOW_CODE : STRING_KEYS.HIDE_CODE })}
          </ToggleButton>
        </footer>
      </>
    ),
    [MobileSignInState.Connected]: null,
    [MobileSignInState.Failed]: null,
  }[currentState];

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={title}>
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
