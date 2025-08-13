import { useEffect, useState } from 'react';

import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useTurnkey } from '@turnkey/sdk-react';
import { styled } from 'styled-components';
import { Address, sha256 } from 'viem';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';

import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

export const GoogleAuth = () => {
  const { indexedDbClient } = useTurnkey();
  const [nonce, setNonce] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const getPublicKey = async () => {
      const publicKey = await indexedDbClient?.getPublicKey();

      if (publicKey) {
        const hashedPublicKey = sha256(publicKey as Address).replace(/^0x/, '');

        setNonce(hashedPublicKey);
      }
    };

    getPublicKey();
  }, [indexedDbClient]);

  const { signInWithOauth, isLoading } = useTurnkeyAuth();

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
        <div className="row pointer-events-none absolute inset-0 justify-center bg-color-layer-5">
          <Icon iconName={IconName.Google} />
        </div>
      </$SocialLoginButton>
    </GoogleOAuthProvider>
  );
};

const $SocialLoginButton = styled(Button)`
  width: 100%;
  border-radius: 1rem;
  --icon-size: 1.5rem;
  overflow: hidden;
  position: relative;
`;
