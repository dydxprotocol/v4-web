import { useMemo } from 'react';

import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { styled } from 'styled-components';
import { sha256 } from 'viem';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';

import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import breakpoints from '@/styles/breakpoints';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

export const GoogleAuth = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { signInWithOauth, isLoading, targetPublicKeys } = useTurnkeyAuth();

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

  const onSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      return;
    }

    signInWithOauth({
      oidcToken: credentialResponse.credential,
      providerName: 'google',
    });
  };

  if (!clientId) {
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <$SocialLoginButton
        type={ButtonType.Button}
        action={ButtonAction.Base}
        size={ButtonSize.BasePlus}
        state={{
          isLoading,
          isDisabled: nonce.trim().length === 0,
        }}
      >
        {nonce.trim().length > 0 && (
          <GoogleLogin
            containerProps={{
              style: {
                position: 'absolute',
                inset: 0,
                backgroundColor: 'transparent',
                height: '100%',
                width: '100%',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                opacity: 0.01,
              },
            }}
            size="large"
            type="standard"
            nonce={nonce}
            onSuccess={onSuccess}
            useOneTap={false}
            auto_select={false}
          />
        )}
        <div tw="row pointer-events-none absolute inset-0 justify-center bg-color-layer-5">
          <Icon iconName={IconName.Google} />
        </div>
      </$SocialLoginButton>
    </GoogleOAuthProvider>
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
