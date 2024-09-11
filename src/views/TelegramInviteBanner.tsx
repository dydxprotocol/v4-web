import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Link } from '@/components/Link';

export const TelegramInviteBanner = () => {
  const stringGetter = useStringGetter();
  const { getInTouch } = useURLConfigs();

  return getInTouch ? (
    <div tw="mb-1 mt-1 justify-between gap-0.5 rounded-0.5 bg-color-layer-5 pb-1 pl-1 pr-2 pt-1">
      {stringGetter({
        key: STRING_KEYS.TELEGRAM_INVITE_BANNER,
        params: {
          HERE_LINK: (
            <Link isInline isAccent href={getInTouch}>
              {stringGetter({ key: STRING_KEYS.HERE })}
            </Link>
          ),
        },
      })}
    </div>
  ) : null;
};
