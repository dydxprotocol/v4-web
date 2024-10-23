import { styled } from 'twin.macro';

import { formMixins } from '@/styles/formMixins';

import { SourceSelectMenu } from './SourceSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';

export const DepositForm = () => {
  return (
    <$Form>
      <SourceSelectMenu />
      <TokenSelectMenu />
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
`;
