import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

export const HighestFeesDecoratorText = () => {
  const stringGetter = useStringGetter();
  return (
    <div tw="text-color-text-0 font-small-regular">
      {stringGetter({
        key: STRING_KEYS.HIGH_FEES_IN_GENERAL,
        params: {
          HIGH_FEES_IN_GENERAL_HIGHLIGHT_TEXT: (
            <span tw="text-red">
              {stringGetter({ key: STRING_KEYS.HIGH_FEES_IN_GENERAL_HIGHLIGHT_TEXT })}
            </span>
          ),
        },
      })}
    </div>
  );
};
