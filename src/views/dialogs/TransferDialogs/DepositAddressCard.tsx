import { useMemo } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useCopyValue } from '@/hooks/useCopyValue';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { QrCode } from '@/components/QrCode';

type DepositAddressCardProps = {
  address: string | undefined;
  chainIcon: string | undefined;
  chainName: string | undefined;
  isLoading?: boolean;
  error?: boolean;
  errorMessage?: string;
};

export const DepositAddressCard = ({
  address,
  chainIcon,
  chainName,
  isLoading = false,
  error = false,
  errorMessage,
}: DepositAddressCardProps) => {
  const stringGetter = useStringGetter();
  const { copied, copy } = useCopyValue({ value: address });

  /**
   * @description Splits the address into 3 parts: first 5 chars, middle part, last 5 chars to render in the UI
   */
  const addressRepresentation = useMemo(() => {
    if (address == null || address.trim().length === 0) {
      return undefined;
    }

    const firstPart = address.slice(0, 5);
    const middlePart = address.slice(5, -5);
    const lastPart = address.slice(-5);

    return {
      firstPart,
      middlePart,
      lastPart,
    };
  }, [address]);

  if (isLoading) {
    return (
      <$AddressCard>
        <div tw="mx-auto flex size-[155px] items-center justify-center">
          <LoadingSpace />
        </div>
      </$AddressCard>
    );
  }

  if (error) {
    return (
      <$AddressCard>
        <div tw="mx-auto flex h-[155px] flex-col items-center justify-center gap-1">
          <Icon iconName={IconName.Warning} tw="size-2 text-color-error" />
          <span tw="text-color-text-0">
            {errorMessage ?? stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })}
          </span>
        </div>
      </$AddressCard>
    );
  }

  return (
    <$AddressCard onClick={copy} tabIndex={0} role="button">
      <div tw="flexColumn min-w-0 justify-between">
        <img tw="size-2.25 rounded-[50%]" src={chainIcon} alt={chainName} />
        {addressRepresentation && address ? (
          <div tw="ml-[-0.5rem] cursor-pointer rounded-[6px] p-0.5 hover:bg-color-layer-1">
            <div tw="min-w-0 whitespace-normal break-words text-justify">
              <span tw="text-color-text-2">{addressRepresentation.firstPart}</span>
              <span tw="text-color-text-0">{addressRepresentation.middlePart}</span>
              <span tw="text-color-text-2">
                {addressRepresentation.lastPart}
                {copied ? (
                  <Icon
                    iconName={IconName.CheckCircle}
                    tw="ml-0.25 inline align-middle text-color-success"
                  />
                ) : (
                  <Icon
                    iconName={IconName.Copy}
                    tw="ml-0.25 inline align-middle text-color-accent"
                  />
                )}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div tw="flex size-[155px] min-w-[155px]">
        {address && <QrCode hasLogo tw="size-full" value={address} />}
      </div>
    </$AddressCard>
  );
};

const $AddressCard = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  padding: 1rem;
  gap: 1rem;
`;
