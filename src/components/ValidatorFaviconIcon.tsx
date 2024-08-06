import { useState } from 'react';

import styled from 'styled-components';

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
        <img
          className={className}
          src={`${baseUrl}/favicon.ico`}
          alt="validator favicon"
          onError={() => setIconFail(true)}
          tw="mr-[0.25em] h-[1.5em] w-[1.5em] rounded-[50%] object-cover"
        />
      );
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
};

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
