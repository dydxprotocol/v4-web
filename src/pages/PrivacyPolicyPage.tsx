import styled from 'styled-components';

import { articleMixins } from '@/styles/articleMixins';

const PrivacyPolicyPage = () => (
  <$Article>
    <header>
      <h1>Privacy Policy</h1>
    </header>
  </$Article>
);

export default PrivacyPolicyPage;
const $Article = styled.article`
  ${articleMixins.article}
`;
