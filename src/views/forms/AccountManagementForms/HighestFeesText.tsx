import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

export const HighestFeesDecoratorText = () => {
  const stringGetter = useStringGetter();
  return (
    <$Text>
      {stringGetter({
        key: STRING_KEYS.HIGH_FEES_IN_GENERAL,
        params: {
          HIGH_FEES_IN_GENERAL_HIGHLIGHT_TEXT: (
            <$RedHighlight>
              {stringGetter({ key: STRING_KEYS.HIGH_FEES_IN_GENERAL_HIGHLIGHT_TEXT })}
            </$RedHighlight>
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

const $RedHighlight = styled.span`
  color: var(--color-red);
`;
