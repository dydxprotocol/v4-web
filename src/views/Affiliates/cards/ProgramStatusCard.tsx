import { ReactNode } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD } from '@/constants/affiliates';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

interface IProgramCardProps {
  className?: string;
  isVip: boolean;
}

export const ProgramStatusCard = ({ className, isVip = false }: IProgramCardProps) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const { affiliateProgram, vipsChannel, affiliateProgramSupportEmail } = useURLConfigs();

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
          VIP_VALUE: (
            <Output
              tw="inline text-color-text-2"
              type={OutputType.Fiat}
              value={DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD}
              fractionDigits={0}
            />
          ),
        },
      })}
    </p>
  );

  const buttonText = isVip
    ? stringGetter({ key: STRING_KEYS.CONTACT_SUPPORT })
    : stringGetter({ key: STRING_KEYS.APPLY_NOW });

  return (
    <$Container className={className}>
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

          {!isVip ? (
            <Button
              tw="w-full"
              action={ButtonAction.Base}
              type={ButtonType.Link}
              href={affiliateProgram}
            >
              {buttonText}
            </Button>
          ) : (
            <div tw="flex gap-1">
              <Button
                tw="w-full"
                action={ButtonAction.Base}
                type={ButtonType.Link}
                href={`mailto:${affiliateProgramSupportEmail}`}
              >
                {buttonText}
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
    </$Container>
  );
};

const $Container = tw.div`rounded-0.625 bg-color-layer-3`;

const $Header = styled.div`
  font-size: 18px;
`;

const $Icon = styled(Icon)`
  font-size: 24px;
`;
