import { useCallback, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { useTurnkey } from '@turnkey/sdk-react';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { HorizontalSeparatorFiller } from '@/components/Separator';

import { isValidEmail } from '@/lib/emailUtils';

import { AppleAuth } from './AuthButtons/AppleAuth';
import { GoogleAuth } from './AuthButtons/GoogleAuth';

export const SignIn = ({
  onDisplayChooseWallet,
  onSignInWithPasskey,
  onSubmitEmail,
}: {
  onDisplayChooseWallet: () => void;
  onSignInWithPasskey: () => void;
  onSubmitEmail: ({ userEmail }: { userEmail: string }) => void;
}) => {
  const stringGetter = useStringGetter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authIframeClient } = useTurnkey();
  const { signInWithOtp } = useTurnkeyAuth();

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        await signInWithOtp({ userEmail: email });
        onSubmitEmail({ userEmail: email });
      } catch (error) {
        logBonsaiError('SignIn', 'onSubmit error', error);
      } finally {
        setIsLoading(false);
      }
    },
    [email, onSubmitEmail, signInWithOtp]
  );

  const hasValidEmail = isValidEmail(email);

  return (
    <form onSubmit={onSubmit} tw="flexColumn gap-1.25">
      <div tw="row gap-1">
        <GoogleAuth />
        <AppleAuth />
      </div>

      <div tw="flexColumn gap-0.75">
        <$EmailInput
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder={stringGetter({ key: STRING_KEYS.EMAIL_PLACEHOLDER })}
          type={InputType.Text}
          css={{
            '--input-borderColor': hasValidEmail ? 'var(--color-accent)' : 'var(--color-border)',
          }}
          slotRight={
            <Button
              tw="rounded-0.75"
              type={ButtonType.Submit}
              action={ButtonAction.Primary}
              size={ButtonSize.Small}
              state={{
                isDisabled: !hasValidEmail || authIframeClient == null,
                isLoading,
              }}
              css={{
                '--button-textColor': hasValidEmail
                  ? 'var(--input-backgroundColor)'
                  : 'var(--color-border)',
                '--button-disabled-backgroundColor': 'var(--color-layer-3)',
              }}
            >
              <Icon iconName={IconName.Arrow} />
            </Button>
          }
        />

        <div tw="row gap-0.5">
          <HorizontalSeparatorFiller />
          <span>{stringGetter({ key: STRING_KEYS.OR })}</span>
          <HorizontalSeparatorFiller />
        </div>

        <$OtherOptionButton
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.BasePlus}
          onClick={onSignInWithPasskey}
        >
          <div tw="row gap-0.5">
            <Icon iconName={IconName.Passkey} />
            {stringGetter({ key: STRING_KEYS.SIGN_IN_PASSKEY })}
          </div>

          <Icon iconName={IconName.ChevronRight} />
        </$OtherOptionButton>

        <$OtherOptionButton
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.BasePlus}
          onClick={onDisplayChooseWallet}
        >
          <div tw="row gap-0.5">
            <Icon iconName={IconName.Wallet2} />
            {stringGetter({ key: STRING_KEYS.SIGN_IN_WALLET })}
          </div>

          <Icon iconName={IconName.ChevronRight} />
        </$OtherOptionButton>
      </div>
    </form>
  );
};

const $EmailInput = styled(FormInput)`
  font-size: 1rem;
  --input-radius: 1rem;
  --border-width: 1px;
  --form-input-paddingY: 0.75rem;
  --form-input-paddingX: 1rem;
`;

const $OtherOptionButton = styled(Button)`
  width: 100%;
  border-radius: 1rem;
  justify-content: space-between;
  --icon-size: 1rem;
`;
