import { useState } from 'react';

import { Validator } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from './Link';

const URL_START = 'https://';

export const ValidatorFaviconIcon = ({
  className,
  url,
  fallbackText,
}: {
  className?: string;
  url?: string;
  fallbackText?: string;
}) => {
  const [iconFail, setIconFail] = useState<boolean>(false);
  const fallback = fallbackText ? (
    <$IconContainer className={className}>{fallbackText.charAt(0)}</$IconContainer>
  ) : null;

  if (url && !iconFail) {
    try {
      const parsedUrl = url.startsWith(URL_START) ? new URL(url) : new URL(`${URL_START}${url}`);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

      return (
        <$Img
          className={className}
          src={`${baseUrl}/favicon.ico`}
          alt="validator favicon"
          onError={() => setIconFail(true)}
        />
      );
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
};

export const ValidatorName = ({ validator }: { validator?: Validator }) => {
  return (
    <$ValidatorName>
      <ValidatorFaviconIcon
        url={validator?.description?.website}
        fallbackText={validator?.description?.moniker}
      />
      {validator?.description?.website ? (
        <Link href={validator?.description?.website}>
          <$TruncatedText>{validator?.description?.moniker} </$TruncatedText>
        </Link>
      ) : (
        <$TruncatedText>{validator?.description?.moniker} </$TruncatedText>
      )}
    </$ValidatorName>
  );
};

const $Img = styled.img`
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.25em;
`;

const $ValidatorName = styled.div`
  display: flex;
  align-items: center;
`;

const $IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5em;
  height: 1.5em;
  background-color: var(--color-layer-6);
  border-radius: 50%;
  font-weight: bold;
  color: var(--color-text-1);
  margin-right: 0.25em;
`;

const $TruncatedText = styled.div`
  ${layoutMixins.textTruncate}
  color: var(--color-text-1);
`;
