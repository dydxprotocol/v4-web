import { useCallback, useMemo, useState } from 'react';

import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { HorizontalSeparatorFiller } from '@/components/Separator';

import { useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/appUiConfigs';
import { getAppTheme } from '@/state/appUiConfigsSelectors';

import { isValidEmail } from '@/lib/emailUtils';

import { GoogleAuth } from './AuthButtons/GoogleAuth';

export const SignIn = ({
  onDisplayChooseWallet,
  onSignInWithPasskey,
  onSubmitEmail,
}: {
  onDisplayChooseWallet: () => void;
  onSignInWithPasskey: () => void;
  onSubmitEmail: () => void;
}) => {
  const stringGetter = useStringGetter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useAppSelector(getAppTheme);

  const handleSocialLogin = useCallback(
    async (loginFunction: () => Promise<void>, _provider: string) => {
      setIsLoading(true);
      try {
        await loginFunction();
      } catch (error) {
        // You can add toast notification here or handle the error as needed
        // Error handling can be implemented based on your app's error handling strategy
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const socialLogins = useMemo(
    () => [
      {
        key: 'apple',
        icon: <Icon iconName={theme === AppTheme.Light ? IconName.Apple : IconName.AppleLight} />,
      },
      {
        key: 'x/twitter',
        icon: <Icon iconName={IconName.SocialX} />,
      },
    ],
    [theme]
  );

  // TODO(turnkey): Implement email login
  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }, []);

  const hasValidEmail = isValidEmail(email);

  return (
    <form onSubmit={onSubmit} tw="flexColumn gap-1.25">
      <div tw="row gap-1">
        <GoogleAuth />
        {socialLogins.map((login) => (
          <$SocialLoginButton
            key={login.key}
            type={ButtonType.Button}
            action={ButtonAction.Base}
            size={ButtonSize.BasePlus}
            state={{
              isDisabled: isLoading,
            }}
          >
            {login.icon}
          </$SocialLoginButton>
        ))}
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
              onClick={onSubmitEmail}
              size={ButtonSize.Small}
              state={{
                isDisabled: !hasValidEmail,
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

const $SocialLoginButton = styled(Button)`
  width: 100%;
  border-radius: 1rem;
  --icon-size: 1.5rem;
`;

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
