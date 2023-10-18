import styled, { AnyStyledComponent } from 'styled-components';

import { articleMixins } from '@/styles/articleMixins';

export const TermsOfUsePage = () => (
  <Styled.Article>
    <header>
      <h1>Terms of Use</h1>
    </header>
  </Styled.Article>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Article = styled.article`
  ${articleMixins.article}
`;
