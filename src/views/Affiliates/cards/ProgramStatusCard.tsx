import { ReactNode } from 'react';

import styled from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

interface IProgramCardProps {
  isVip: boolean;
}

export const ProgramStatusCard = ({ isVip = false }: IProgramCardProps) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const { vipsChannel, affiliateProgramSupportEmail } = useURLConfigs();

  const title: ReactNode = isVip
    ? stringGetter({ key: STRING_KEYS.PROGRAM_CARD_TITLE_VIP })
    : stringGetter({ key: STRING_KEYS.PROGRAM_CARD_TITLE });

  const body: ReactNode = isVip ? (
    <p tw="text-color-text-0">
      {stringGetter({
        key: STRING_KEYS.PROGRAM_CARD_BODY_VIP,
        params: {
          VIP: (
            <span tw="text-color-text-2">{stringGetter({ key: STRING_KEYS.VIP_AFFILIATE })}</span>
          ),
        },
      })}
    </p>
  ) : (
    <p tw="text-color-text-0">
      {stringGetter({
        key: STRING_KEYS.PROGRAM_CARD_BODY,
        params: {
          VIP_VALUE: null, // TODO(Jared): UPDATE STRING
        },
      })}
    </p>
  );

  return (
    <div tw="w-full rounded-0.625 bg-color-layer-3 notTablet:w-4/12">
      {dydxAddress && (
        <div tw="flex flex-col gap-y-1 p-1">
          <$Header tw="flex items-center">
            <$Icon
              iconName={isVip ? IconName.CheckCircle : IconName.Rocket}
              className={isVip ? 'text-color-success' : 'text-color-text-1'}
            />
            <h4 tw="ml-0.5 text-color-text-2">{title}</h4>
          </$Header>
          <div>{body}</div>

          {isVip && (
            <div tw="flex gap-1">
              <Button
                tw="w-full"
                action={ButtonAction.Base}
                type={ButtonType.Link}
                href={`mailto:${affiliateProgramSupportEmail}`}
              >
                {stringGetter({ key: STRING_KEYS.CONTACT_SUPPORT })}
              </Button>
              <Button
                tw="w-full"
                action={ButtonAction.Base}
                type={ButtonType.Link}
                href={vipsChannel}
              >
                {stringGetter({ key: STRING_KEYS.JOIN_DISCORD })}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const $Header = styled.div`
  font-size: 18px;
`;

const $Icon = styled(Icon)`
  font-size: 24px;
`;
