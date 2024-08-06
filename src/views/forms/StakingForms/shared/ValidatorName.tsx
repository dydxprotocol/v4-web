import { Validator } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from '@/components/Link';
import { ValidatorFaviconIcon } from '@/components/ValidatorFaviconIcon';

export const ValidatorName = ({
  validator,
  className,
}: {
  validator?: Validator;
  className?: string;
}) => {
  return (
    <div className={className} tw="flex items-center">
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
    </div>
  );
};
const $TruncatedText = styled.div`
  ${layoutMixins.textTruncate}
  color: var(--color-text-1);
`;
