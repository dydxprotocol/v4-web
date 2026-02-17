import { type ReactNode } from 'react';

import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonStyle,
  ButtonType,
} from '@/constants/buttons';

import { CopyButton } from '@/components/CopyButton';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { InfoGrid } from '@/components/InfoGrid';
import { Output, OutputType } from '@/components/Output';

import { truncateAddress } from '@/lib/wallet';

export type TokenInfoLink = {
  icon: IconName;
  url: string;
  title?: string;
};

export type TokenInfoItem = {
  key: string;
  label: string;
  value: ReactNode;
  iconName?: IconName;
};

type SpotTokenInfoProps = {
  links: TokenInfoLink[];
  items: TokenInfoItem[];
  contractAddress: string;
  createdAt?: number | string | Date;
  className?: string;
  isLoading?: boolean;
};

// TODO: spot localization

export const SpotTokenInfo = ({
  links,
  items,
  contractAddress,
  createdAt,
  className,
  isLoading = false,
}: SpotTokenInfoProps) => {
  return (
    <div className={className} tw="flexColumn gap-1 p-1">
      <div tw="spacedRow">
        <div tw="text-color-text-2 font-base-bold">Token Info</div>
        <div tw="row gap-0.25">
          {(isLoading ? [null] : links).map((l) => (
            <IconButton
              key={isLoading ? 'loading-icon' : l?.url}
              href={l?.url}
              aria-label={l?.title ?? l?.url}
              action={ButtonAction.Navigation}
              iconName={l?.icon}
              iconSize="1.125rem"
              state={{ isLoading }}
              type={ButtonType.Link}
            />
          ))}
        </div>
      </div>

      <InfoGrid
        isLoading={isLoading}
        items={items.map((item) => ({
          key: item.key,
          label: (
            <span tw="row gap-0.25">
              {item.iconName && <Icon iconName={item.iconName} size="1rem" />}
              {item.label}
            </span>
          ),
          value: item.value,
        }))}
      />

      <div tw="spacedRow">
        <CopyButton
          value={contractAddress}
          buttonStyle={ButtonStyle.Default}
          shape={ButtonShape.Pill}
          action={ButtonAction.Secondary}
          copyIconPosition="end"
          size={ButtonSize.XXSmall}
          buttonType="default"
        >
          <span tw="font-mini-medium">{truncateAddress(contractAddress, '')}</span>
        </CopyButton>
        {(isLoading || !!createdAt) && (
          <div tw="row items-center gap-0.25 font-mini-book">
            <Icon iconName={IconName.Clock} />
            <Output
              type={OutputType.RelativeTime}
              value={createdAt ? new Date(createdAt).getTime() : null}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};
