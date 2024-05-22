import { useState } from 'react';

import { Validator } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import styled from 'styled-components';

import { Link } from './Link';
import { Output, OutputType } from './Output';

export type ValidatorNameProps = {
  validator?: Validator;
};

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

  if (url && !iconFail) {
    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    return (
      <$Img
        className={className}
        src={`${baseUrl}/favicon.ico`}
        alt="validator favicon"
        onError={() => setIconFail(true)}
      />
    );
  }
  if (fallbackText) {
    return <$IconContainer className={className}>{fallbackText.charAt(0)}</$IconContainer>;
  }

  return null;
};

export const ValidatorName = ({ validator }: ValidatorNameProps) => {
  if (!validator) {
    return null;
  }
  const output = (
    <$Output
      type={OutputType.Text}
      value={validator?.description?.moniker}
      slotLeft={
        <ValidatorFaviconIcon
          url={validator?.description?.website}
          fallbackText={validator?.description?.moniker}
        />
      }
    />
  );

  if (validator?.description?.website) {
    return (
      <Link href={validator?.description?.website} withIcon>
        {output}
      </Link>
    );
  }
  return output;
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

const $Img = styled.img`
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.25em;
`;

const $Output = styled(Output)`
  color: var(--color-text-1);
`;
