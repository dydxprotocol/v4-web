import { useMemo } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import AppleSignIn from 'react-apple-signin-auth';
import { styled } from 'styled-components';
import { sha256 } from 'viem';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';

import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import breakpoints from '@/styles/breakpoints';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

import { useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/appUiConfigs';
import { getAppTheme } from '@/state/appUiConfigsSelectors';

type AppleAuthSuccessData = {
  authorization: {
    state?: string;
    code: string;
    id_token: string;
  };
  user?: {
    email: string;
    name: {
      firstName?: string;
      lastName?: string;
    };
  };
};

export const AppleAuth = () => {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI;
  const { signInWithOauth, isLoading, targetPublicKeys } = useTurnkeyAuth();
  const appTheme = useAppSelector(getAppTheme);
  const isLightMode = appTheme === AppTheme.Light;

  const nonce = useMemo(() => {
    if (targetPublicKeys) {
      const hashedPublicKey = sha256(targetPublicKeys.publicKeyCompressed as `0x${string}`).replace(
        /^0x/,
        ''
      );
      return hashedPublicKey;
    }

    return '';
  }, [targetPublicKeys]);

  const handleSuccess = (data: AppleAuthSuccessData) => {
    const { authorization } = data;

    if (!authorization.id_token) {
      return;
    }

    signInWithOauth({
      oidcToken: authorization.id_token,
      providerName: 'apple',
    });
  };

  const handleError = (error: any) => {
    logBonsaiError('AppleAuth', 'Unsuccessful attempt to sign in with Apple OAuth', error);
  };

  if (!clientId || !redirectURI) {
    return null;
  }

  return (
    <AppleSignIn
      authOptions={{
        clientId,
        scope: 'email name',
        redirectURI,
        state: '',
        nonce,
        usePopup: true,
      }}
      uiType="dark"
      onSuccess={handleSuccess}
      onError={handleError}
      render={(props: any) => (
        <$SocialLoginButton
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.BasePlus}
          state={{
            isLoading,
            isDisabled: nonce.trim().length === 0,
          }}
          {...props}
        >
          <div tw="row pointer-events-none absolute inset-0 justify-center bg-color-layer-5">
            <Icon iconName={isLightMode ? IconName.Apple : IconName.AppleLight} />
          </div>
        </$SocialLoginButton>
      )}
    />
  );
};

const $SocialLoginButton = styled(Button)`
  width: 100%;
  border-radius: 0.75rem;
  --icon-size: 1.5rem;
  overflow: hidden;
  position: relative;

  @media ${breakpoints.tablet} {
    border-radius: 1rem;
  }
`;
