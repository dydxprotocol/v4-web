import { ReactNode, useCallback, useMemo } from 'react';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

export const SetupPasskeyDialog = ({
  onClose,
  setIsOpen,
}: {
  onClose: () => void;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const { registerPasskey } = useTurnkeyAuth();
  const stringGetter = useStringGetter();
  const modifiedSetIsOpen = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);

      if (!isOpen) {
        onClose();
      }
    },
    [onClose, setIsOpen]
  );

  // TODO(turnkey): Localization
  const valueProps: Array<{
    icon: ReactNode;
    heading: string;
    description: string;
  }> = useMemo(() => {
    return [
      {
        icon: <Icon tw="size-2 text-color-accent" iconName={IconName.DoubleChevronRight} />,
        heading: 'Quick',
        description: 'Use biommetrics to log in',
      },
      {
        icon: <Icon tw="size-2 text-color-accent" iconName={IconName.ShieldStroke} />,
        heading: 'Secure',
        description: 'Protection against phishing attacks',
      },
      {
        icon: <Icon tw="size-2 text-color-accent" iconName={IconName.DevicesStroke} />,
        heading: 'Multi Device',
        description: 'Seamless across iCloud/Chrome',
      },
    ];
  }, []); // stringGetter will go here

  return (
    <Dialog
      isOpen
      setIsOpen={modifiedSetIsOpen}
      title={<div />}
      css={{
        '--dialog-header-paddingBottom': 0,
      }}
    >
      <div tw="column justify-items-center text-center">
        <h3 tw="mb-0.25 text-color-text-2 font-large-bold">
          {stringGetter({ key: STRING_KEYS.REGISTER_PASSKEY, fallback: 'Setup Passkey' })}
        </h3>
        <p tw="text-color-text-0 font-small-book">Passkeys are a secure alternative to passwords</p>

        <div tw="column my-1.5 gap-1.25">
          {valueProps.map(({ icon, heading, description }) => (
            <div tw="row gap-1" key={heading}>
              {icon}
              <div tw="column text-left">
                <span tw="text-color-text-2 font-base-bold">{heading}</span>
                <span tw="text-color-text-0 font-small-book">{description}</span>
              </div>
            </div>
          ))}
        </div>

        <div tw="flexColumn w-full gap-0">
          <Button
            tw="w-full"
            type={ButtonType.Button}
            action={ButtonAction.SimplePrimary}
            size={ButtonSize.BasePlus}
            css={{
              color: 'var(--dialog-backgroundColor, var(--text-color-text-0))',
            }}
            onClick={() => {
              registerPasskey();
              modifiedSetIsOpen(false);
            }}
          >
            <Icon tw="size-1.5" iconName={IconName.Passkey} />
            <span>
              {stringGetter({ key: STRING_KEYS.REGISTER_PASSKEY, fallback: 'Setup Passkey' })}
            </span>
          </Button>

          <Button
            tw="w-full text-color-accent"
            type={ButtonType.Button}
            action={ButtonAction.Navigation}
            size={ButtonSize.BasePlus}
            onClick={() => modifiedSetIsOpen(false)}
          >
            {stringGetter({ key: STRING_KEYS.SKIP_FOR_NOW, fallback: 'Skip for now' })}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
