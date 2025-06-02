import styled from 'styled-components';
import tw from 'twin.macro';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';

import { UnseenIndicator } from './UnseenIndicator';

export const TradeNotificationRow = ({
  className,
  logo,
  iconName,
  miniIcon,
  slotLeft,
  slotRight,
  isUnseen,
}: {
  className?: string;
  // Asset logoUrl
  logo?: string | null | undefined;
  // Icon name (can be used instead of logo)
  iconName?: IconName;
  // Mini icon rendered in the top right corner of the icon
  miniIcon?: React.ReactNode;

  slotLeft: React.ReactNode;
  slotRight?: React.ReactNode;
  isUnseen?: boolean;
}) => {
  const icon = iconName ? (
    <Icon iconName={iconName} tw="size-2 min-w-2" />
  ) : logo ? (
    <AssetIcon logoUrl={logo} tw="size-2 min-w-2" />
  ) : null;

  return (
    <$OrderNotificationRow className={className}>
      <div tw="row min-w-0 flex-grow-0 gap-0.5">
        <div tw="relative flex">
          {icon}
          {miniIcon}
        </div>
        <div tw="flexColumn">{slotLeft}</div>
      </div>

      <div tw="row gap-1">
        <div tw="flex flex-col items-end text-end">{slotRight}</div>
        {isUnseen && <UnseenIndicator />}
      </div>
    </$OrderNotificationRow>
  );
};

const $OrderNotificationRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
