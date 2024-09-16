import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from '@/components/Link';

export const TelegramInviteBanner = () => {
  const stringGetter = useStringGetter();
  const { getInTouch } = useURLConfigs();

  return getInTouch ? (
    <$Banner tw="mb-1 bg-color-layer-5 p-1">
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
    </$Banner>
  ) : null;
};

const $Banner = styled.div`
  --color-border: transparent;
  ${layoutMixins.withOuterBorderClipped}
`;
