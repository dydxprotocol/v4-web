import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

type ElementProps = {
  portfolioValue: number;
  telegramUrl?: string;
};

export type VipTelegramNotificationProps = NotificationProps & ElementProps;

export const VipTelegramNotification = ({
  isToast,
  notification,
  portfolioValue: _portfolioValue,
  telegramUrl = 'https://t.me/+NLOpf5jiAEVjODFh',
}: VipTelegramNotificationProps) => {
  const stringGetter = useStringGetter();

  const title = stringGetter({
    key: STRING_KEYS.YOURE_INVITED,
    fallback: "You're Invited",
  });

  const description = stringGetter({
    key: STRING_KEYS.VIP_TELEGRAM_BODY,
    fallback:
      'Private Telegram Group for VIP traders. Enjoy white glove service, special incentives and competitions',
  });

  const handleViewClick = () => {
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<$Icon src="/telegram-noti.svg" alt="Telegram" />}
      slotTitle={title}
      slotCustomContent={
        <$Content>
          <$Description>{description}</$Description>
          <Button
            action={ButtonAction.Primary}
            type={ButtonType.Button}
            onClick={handleViewClick}
            tw="flex-shrink-0 rounded-0.5 border-none bg-color-layer-6 text-small text-color-text-button font-base-medium hover:bg-color-layer-5"
          >
            {stringGetter({ key: STRING_KEYS.VIEW })}
          </Button>
        </$Content>
      }
    />
  );
};

const $Icon = styled.img`
  ${tw`h-3 w-3 flex-shrink-0`};
`;

const $Content = styled.div`
  ${tw`mt-0.5 flex items-center justify-between gap-1`};
`;

const $Description = styled.p`
  ${tw`m-0 text-color-text-0 font-small-book`};
  line-height: 110%;
`;
