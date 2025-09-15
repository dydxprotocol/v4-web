import { useEffect, useMemo, useState } from 'react';

import { selectIndexerReady, selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { avalanche, polygon } from 'viem/chains';

import { CHAIN_INFO, EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { SOLANA_MAINNET_ID } from '@/constants/solana';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useCopyValue } from '@/hooks/useCopyValue';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

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
  const isSimpleUi = useSimpleUiEnabled();
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

      return response;
    },
  });

  const chains = useMemo(() => {
    if (selectedTab === 'perpetuals') {
      const evmChains = EVM_DEPOSIT_CHAINS.map((chain) => {
        return chain.id;
      }).filter((chainId) => chainId !== polygon.id); // Polygon unsupported for now

      return [...evmChains, SOLANA_MAINNET_ID];
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

      if (selectedChain === SOLANA_MAINNET_ID) {
        return depositAddresses.svmAddress;
      }

      return depositAddresses.evmAddress;
    }

    return undefined; // TODO(spot): Add spot deposit address
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

  const warningMessage = useMemo(() => {
    const chainName = CHAIN_INFO[selectedChain]?.name;
    const assets =
      selectedChain === SOLANA_MAINNET_ID
        ? 'USDC'
        : selectedChain === avalanche.id.toString()
          ? 'USDC or AVAX'
          : 'USDC or ETH';

    return (
      <span tw="block text-center text-color-warning font-small-medium">
        Only deposit {assets} on {chainName} network. <br />
        Any other assets sent to this address can result in a loss of funds.
      </span>
    );
  }, [selectedChain]);

  const { copied, copy } = useCopyValue({ value: depositAddress });

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
    <$AddressCard onClick={copy} tabIndex={0} role="button">
      <div tw="flexColumn min-w-0 justify-between">
        <img
          tw="size-2.25 rounded-[50%]"
          src={CHAIN_INFO[selectedChain]?.icon}
          alt={CHAIN_INFO[selectedChain]?.name}
        />
        {addressRepresentation && depositAddress ? (
          <div tw="row ml-[-0.5rem] cursor-pointer items-end gap-0.125 rounded-[6px] p-0.5 hover:bg-color-layer-1">
            <div tw="min-w-0 whitespace-normal break-words text-justify">
              <span tw="text-color-text-2">{addressRepresentation.firstPart}</span>
              <span tw="text-color-text-0">{addressRepresentation.middlePart}</span>
              <span tw="text-color-text-2">{addressRepresentation.lastPart}</span>
            </div>
            {copied ? (
              <Icon iconName={IconName.CheckCircle} tw="text-color-success" />
            ) : (
              <Icon iconName={IconName.Copy} tw="text-color-accent" />
            )}
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
      title={
        <div
          tw="w-full text-center"
          css={{
            marginLeft: 'var(--closeIcon-size)', // Keeps title centered despite close icon
          }}
        >
          {stringGetter({ key: STRING_KEYS.DEPOSIT })}
        </div>
      }
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <div tw="flexColumn gap-1">
        <div>
          <TabGroup
            value={selectedTab}
            onTabChange={setSelectedTab}
            options={[
              // TODO(spot): Localize
              { label: 'Spot', value: 'spot', disabled: true },
              { label: stringGetter({ key: STRING_KEYS.PERPETUALS }), value: 'perpetuals' },
            ]}
          />
        </div>

        <SelectMenu
          fullWidthPopper
          withPortal={isSimpleUi ? false : undefined}
          tw="h-4 w-full text-color-text-2"
          value={selectedChain}
          onValueChange={setSelectedChain}
          label={stringGetter({ key: STRING_KEYS.NETWORK })}
          position="popper"
          side="bottom"
          sideOffset={8}
          css={
            isSimpleUi && {
              '--trigger-open-backgroundColor': 'var(--color-layer-2)',
            }
          }
          contentCss={{
            '--popover-backgroundColor': 'var(--color-layer-2)',
          }}
        >
          {chains.map((id) => (
            <SelectItem key={id} value={id.toString()} label={CHAIN_INFO[id]?.name} />
          ))}
        </SelectMenu>

        {addressCard}

        {warningMessage}
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
    --dialog-paddingX: 1.25rem;
    --dialog-header-paddingTop: 1.25rem;
    --dialog-header-paddingBottom: 1.25rem;
  }
`;

const $AddressCard = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  padding: 1rem;
  gap: 1rem;
`;
