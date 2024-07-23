import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

export const LowestFeesDecoratorText = () => {
  const stringGetter = useStringGetter();
  return (
    <div tw="text-text-0 font-small-regular">
      {stringGetter({
        key: STRING_KEYS.LOWEST_FEES_WITH_USDC,
        params: {
          LOWEST_FEES_HIGHLIGHT_TEXT: (
            <span tw="text-green">
              {stringGetter({ key: STRING_KEYS.LOWEST_FEES_HIGHLIGHT_TEXT })}
            </span>
          ),
        },
      })}
    </div>
  );
};
