import { type ReactNode } from 'react';

import { ButtonSize, ButtonStyle } from '@/constants/buttons';

import { CopyButton } from '@/components/CopyButton';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';

import { truncateAddress } from '@/lib/wallet';

type TokenInfoLink = {
  icon: IconName;
  url: string;
  title?: string;
};

type TokenInfoItem = {
  key: string;
  label: string;
  value: ReactNode;
  iconName?: IconName;
};

type SpotTokenInfoProps = {
  links: TokenInfoLink[];
  items: TokenInfoItem[];
  contractAddress: string;
  createdAt: number | string | Date;
  className?: string;
};

export const SpotTokenInfo = ({
  links,
  items,
  contractAddress,
  createdAt,
  className,
}: SpotTokenInfoProps) => {
  return (
    <div className={className} tw="flexColumn gap-1 p-1">
      <div tw="spacedRow">
        <div tw="text-color-text-2 font-base-bold">Token Info</div>
        <div tw="row gap-0.25">
          {links.map((l) => (
            <IconButton
              key={l.url}
              href={l.url}
              aria-label={l.title ?? l.url}
              buttonStyle={ButtonStyle.WithoutBackground}
              iconName={l.icon}
              iconSize="1.125rem"
            />
          ))}
        </div>
      </div>

      <Details
        items={items.map((item) => ({
          key: item.key,
          label: (
            <span tw="row items-center gap-0.25 text-color-text-0 font-mini-book">
              {item.iconName && <Icon iconName={item.iconName} size="1rem" />}
              {item.label}
            </span>
          ),
          value: <span tw="font-base-bold">{item.value}</span>,
        }))}
        layout="grid"
        tw="gap-[0.5rem] [--details-grid-numColumns:3]"
      />

      <div tw="spacedRow">
        <CopyButton
          value={contractAddress}
          buttonStyle={ButtonStyle.WithoutBackground}
          size={ButtonSize.XXSmall}
          buttonType="text"
        >
          <span tw="font-base-medium">{truncateAddress(contractAddress, '')}</span>
        </CopyButton>
        <div tw="row items-center gap-0.25 font-mini-book">
          <Icon iconName={IconName.Clock} />
          <Output type={OutputType.RelativeTime} value={new Date(createdAt).getTime()} />
        </div>
      </div>
    </div>
  );
};
