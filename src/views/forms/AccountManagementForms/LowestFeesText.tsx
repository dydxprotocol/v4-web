import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

export const LowestFeesDecoratorText = () => {
  const stringGetter = useStringGetter();
  return (
    <$Text>
      {stringGetter({
        key: STRING_KEYS.LOWEST_FEES_WITH_USDC,
        params: {
          LOWEST_FEES_HIGHLIGHT_TEXT: (
            <$GreenHighlight>
              {stringGetter({ key: STRING_KEYS.LOWEST_FEES_HIGHLIGHT_TEXT })}
            </$GreenHighlight>
          ),
        },
      })}
    </$Text>
  );
};

const $Text = styled.div`
  font: var(--font-small-regular);
  color: var(--color-text-0);
`;

const $GreenHighlight = styled.span`
  color: var(--color-green);
`;
