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
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

interface IProgramCardProps {
  className?: string;
  isVip: boolean;
}

const ConnectWallet = () => {
  const stringGetter = useStringGetter();

  return (
    <div className="flex flex-col items-center justify-center gap-y-1 px-4 py-2 text-center">
      <p>{stringGetter({ key: STRING_KEYS.AFFILIATE_CONNECT_WALLET })}</p>
      <OnboardingTriggerButton />
    </div>
  );
};

export const ProgramStatusCard = ({ className, isVip = false }: IProgramCardProps) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const { affiliateProgram, vipsChannel, affiliateProgramSupportEmail } = useURLConfigs();

  const title: ReactNode = isVip
    ? stringGetter({ key: STRING_KEYS.PROGRAM_CARD_TITLE_VIP })
    : stringGetter({ key: STRING_KEYS.PROGRAM_CARD_TITLE });

  const body: ReactNode = isVip ? (
    <p className="text-color-text-0">
      {stringGetter({
        key: STRING_KEYS.PROGRAM_CARD_BODY_VIP,
        params: {
          VIP: <span className="text-color-text-2">{stringGetter({ key: STRING_KEYS.VIP })}</span>,
        },
      })}
    </p>
  ) : (
    <p className="text-color-text-0">
      {stringGetter({
        key: STRING_KEYS.PROGRAM_CARD_BODY,
        params: {
          VIP_VALUE: (
            <span className="text-color-text-2">
              {DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD.toLocaleString()}
            </span>
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
      {!dydxAddress && <ConnectWallet />}

      {dydxAddress && (
        <div className="flex flex-col gap-y-1 p-1">
          <$Header className="align-center flex">
            <$Icon
              iconName={isVip ? IconName.CheckCircle : IconName.Rocket}
              className={isVip ? 'text-color-success' : 'text-color-text-1'}
            />
            <h4 className="ml-0.5 text-color-text-2">{title}</h4>
          </$Header>
          <div>{body}</div>

          {!isVip ? (
            <Button
              className="w-full"
              action={ButtonAction.Base}
              type={ButtonType.Link}
              href={affiliateProgram}
            >
              {buttonText}
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                className="w-full"
                action={ButtonAction.Base}
                type={ButtonType.Link}
                href={`mailto:${affiliateProgramSupportEmail}`}
              >
                {buttonText}
              </Button>
              <Button
                className="w-full"
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

const $Container = tw.div`h-full rounded-0.625 bg-color-layer-3`;

const $Header = styled.div`
  font-size: 18px;
`;

const $Icon = styled(Icon)`
  font-size: 24px;
`;
