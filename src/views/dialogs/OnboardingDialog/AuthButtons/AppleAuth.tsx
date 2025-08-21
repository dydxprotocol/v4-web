import { useMemo } from 'react';

import AppleLogin from 'react-apple-login';
import { styled } from 'styled-components';
import { sha256 } from 'viem';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';

import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

export const AppleAuth = () => {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const redirectURI = `${import.meta.env.VITE_BASE_URL}/oauth-callback/apple`;
  const { isLoading, targetPublicKeys } = useTurnkeyAuth();

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

  if (!clientId) {
    return null;
  }

  return (
    <AppleLogin
      clientId={clientId}
      redirectURI={redirectURI}
      responseType="code id_token"
      nonce={nonce}
      responseMode="fragment"
      render={({ onClick }) => (
        <$SocialLoginButton
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.BasePlus}
          state={{
            isLoading,
            isDisabled: nonce.trim().length === 0,
          }}
          onClick={onClick}
        >
          <div className="row pointer-events-none absolute inset-0 justify-center bg-color-layer-5">
            <Icon iconName={IconName.Google} />
          </div>
        </$SocialLoginButton>
      )}
    />
  );
};

const $SocialLoginButton = styled(Button)`
  width: 100%;
  border-radius: 1rem;
  --icon-size: 1.5rem;
  overflow: hidden;
  position: relative;
`;
