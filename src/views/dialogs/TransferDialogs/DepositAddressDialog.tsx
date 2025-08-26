import { useEffect, useMemo, useState } from 'react';

import { logTurnkey } from '@/bonsai/logs';
import { selectIndexerReady, selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { avalanche } from 'viem/chains';

import { ButtonStyle } from '@/constants/buttons';
import { CHAIN_INFO, EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { SOLANA_MAINNET_ID } from '@/constants/solana';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { CopyButton } from '@/components/CopyButton';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { QrCode } from '@/components/QrCode';
import { SelectItem, SelectMenu } from '@/components/SelectMenu';
import { TabGroup } from '@/components/TabGroup';

import { useAppSelector } from '@/state/appTypes';

type DepositTab = 'spot' | 'perpetuals';

export const DepositAddressDialog = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const [selectedChain, setSelectedChain] = useState('1');
  const [selectedTab, setSelectedTab] = useState<DepositTab>('perpetuals');

  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

  const { dydxAddress } = useAccounts();
  const indexerUrl = useAppSelector(selectIndexerUrl);
  const indexerReady = useAppSelector(selectIndexerReady);

  const canQueryForDepositAddresses = dydxAddress != null && indexerReady;

  const {
    data: depositAddresses,
    isLoading: isLoadingDepositAddresses,
    isError: failedToFetchDepositAddresses,
  } = useQuery({
    enabled: canQueryForDepositAddresses,
    queryKey: ['turnkeyWallets'],
    queryFn: async (): Promise<{
      avalancheAddress: string;
      evmAddress: string;
      svmAddress: string;
    }> => {
      const response = await fetch(`${indexerUrl}/v4/bridging/getDepositAddress/${dydxAddress}`, {
        method: 'GET',
      }).then((res) => res.json());

      logTurnkey('DepositAddressDialog', 'walletsQuery', response);

      return response;
    },
  });

  const chains = useMemo(() => {
    if (selectedTab === 'perpetuals') {
      return EVM_DEPOSIT_CHAINS.map((chain) => {
        return chain.id;
      });
    }

    return [SOLANA_MAINNET_ID];
  }, [selectedTab]);

  const depositAddress: string | undefined = useMemo(() => {
    if (depositAddresses == null) {
      return undefined;
    }

    if (selectedTab === 'perpetuals') {
      if (selectedChain === avalanche.id.toString()) {
        return depositAddresses.avalancheAddress;
      }

      return depositAddresses.evmAddress;
    }

    return depositAddresses.svmAddress;
  }, [depositAddresses, selectedChain, selectedTab]);

  useEffect(() => {
    if (chains[0] == null) {
      return;
    }

    setSelectedChain(chains[0].toString());
  }, [chains]);

  /**
   * @description Splits the deposit address into 3 parts: first 5 chars, middle part, last 5 chars to render in the UI
   */
  const addressRepresentation = useMemo(() => {
    if (depositAddress == null || depositAddress.trim().length === 0) {
      return undefined;
    }

    const firstPart = depositAddress.slice(0, 5);
    const middlePart = depositAddress.slice(5, -5);
    const lastPart = depositAddress.slice(-5);

    return {
      firstPart,
      middlePart,
      lastPart,
    };
  }, [depositAddress]);

  logTurnkey('DepositAddressDialog', 'addressRepresentation', {
    addressRepresentation,
    depositAddress,
    selectedChain,
    selectedTab,
    depositAddresses,
  });

  const addressCard = isLoadingDepositAddresses ? (
    <$AddressCard>
      <div tw="mx-auto flex size-[155px] items-center justify-center">
        <LoadingSpace />
      </div>
    </$AddressCard>
  ) : failedToFetchDepositAddresses ? (
    <$AddressCard>
      <div tw="mx-auto flex h-[155px] flex-col items-center justify-center gap-1">
        <Icon iconName={IconName.Warning} tw="size-2 text-color-error" />
        <span tw="text-color-text-0">
          {stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })}
        </span>
      </div>
    </$AddressCard>
  ) : (
    <$AddressCard>
      <div tw="flexColumn min-w-0 justify-between">
        <img
          tw="size-2.25 rounded-[50%]"
          src={CHAIN_INFO[selectedChain]?.icon}
          alt={CHAIN_INFO[selectedChain]?.name}
        />
        {addressRepresentation && depositAddress ? (
          <div tw="row items-end gap-0.25">
            <div tw="min-w-0 whitespace-normal break-words text-justify">
              <span tw="text-color-text-2">{addressRepresentation.firstPart}</span>
              <span tw="text-color-text-0">{addressRepresentation.middlePart}</span>
              <span tw="text-color-text-2">{addressRepresentation.lastPart}</span>
            </div>
            <CopyButton
              buttonType="icon"
              tw="text-color-accent"
              buttonStyle={ButtonStyle.WithoutBackground}
              value={depositAddress}
            />
          </div>
        ) : null}
      </div>

      <div tw="flex size-[155px] min-w-[155px]">
        {depositAddress && <QrCode hasLogo tw="size-full" value={depositAddress} />}
      </div>
    </$AddressCard>
  );

  return (
    <$Dialog
      isOpen
      withAnimation
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <div tw="flexColumn gap-1">
        <div>
          <TabGroup
            value={selectedTab}
            onTabChange={setSelectedTab}
            options={[
              // TODO(spot): Localize
              { label: 'Spot', value: 'spot' },
              { label: stringGetter({ key: STRING_KEYS.PERPETUALS }), value: 'perpetuals' },
            ]}
          />
        </div>

        <SelectMenu
          fullWidthPopper
          tw="h-4 w-full text-color-text-2"
          value={selectedChain}
          onValueChange={setSelectedChain}
          label={stringGetter({ key: STRING_KEYS.NETWORK })}
          position="popper"
          side="bottom"
          sideOffset={8}
          contentCss={{
            '--popover-backgroundColor': 'var(--color-layer-2)',
          }}
        >
          {chains.map((id) => (
            <SelectItem key={id} value={id.toString()} label={CHAIN_INFO[id]?.name} />
          ))}
        </SelectMenu>

        {addressCard}

        <span tw="block text-center text-color-warning font-small-medium">
          Only deposit USDC or ETH on Ethereum network. <br />
          Funds sent to any other networks can result in a loss of funds.
        </span>
      </div>
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  @media ${breakpoints.notMobile} {
    max-width: 26.25rem;
    --dialog-content-paddingLeft: 1.25rem;
    --dialog-content-paddingRight: 1.25rem;
    --dialog-content-paddingBottom: 1.25rem;
  }
`;

const $AddressCard = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  padding: 1rem;
  gap: 2rem;
`;
