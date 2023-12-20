import styled, { AnyStyledComponent } from 'styled-components';

import { articleMixins } from '@/styles/articleMixins';

const PrivacyPolicyPage = () => (
  <Styled.Article>
    <header>
      <h1>Privacy Policy</h1>
    </header>
  </Styled.Article>
);

export default PrivacyPolicyPage;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Article = styled.article`
  ${articleMixins.article}
`;
