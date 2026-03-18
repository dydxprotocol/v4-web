import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import styled from 'styled-components';
import { avalanche, mainnet, polygon } from 'viem/chains';

import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ASSET_ICON_MAP } from '@/constants/assets';
import { CHAIN_INFO, EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { ComplianceStates } from '@/constants/compliance';
import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { SOLANA_MAINNET_ID } from '@/constants/solana';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useDepositAddress } from '@/hooks/useDepositAddress';
import { useEnableSpot } from '@/hooks/useEnableSpot';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { formatNumberOutput, OutputType } from '@/components/Output';
import { SelectItem, SelectMenu, SelectMenuTrigger } from '@/components/SelectMenu';
import { WithLabel } from '@/components/WithLabel';
import { SpotTabItem, SpotTabs } from '@/pages/spot/SpotTabs';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { track } from '@/lib/analytics/analytics';
import { calc } from '@/lib/do';

import { DepositAddressCard } from './DepositAddressCard';
import { SpotDepositForm } from './DepositDialog2/SpotDepositForm';

type DepositTab = 'spot' | 'perpetuals';

const MIN_DEPOSIT = 20;
const MAX_DEPOSIT = 100_000;
const ETH_MIN_INSTANT_DEPOSIT = 50;

export const DepositAddressDialog = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const [selectedChain, setSelectedChain] = useState('1');
  const [selectedTab, setSelectedTab] = useState<DepositTab>('perpetuals');
  const isSimpleUi = useSimpleUiEnabled();
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();
  const isSpotEnabled = useEnableSpot();
  const { complianceState } = useComplianceState();

  const { dydxAddress, solanaAddress } = useAccounts();
  const { isUploadingAddress } = useTurnkeyAuth();
  const {
    depositAddresses,
    isLoadingDepositAddresses,
    failedToFetchDepositAddresses,
    fetchDepositAddressesError,
  } = useDepositAddress();

  useEffect(() => {
    // Optimistic Deposit Initiated for tracking purposes
    if (selectedTab === 'perpetuals') {
      track(AnalyticsEvents.TurnkeyDepositInitiated({}));
    } else {
      track(AnalyticsEvents.SpotDepositInitiated({}));
    }
  }, [selectedTab]);

  useEffect(() => {
    if (failedToFetchDepositAddresses && dydxAddress) {
      track(
        AnalyticsEvents.TurnkeyFetchDepositAddressError({
          dydxAddress,
          error: fetchDepositAddressesError?.message ?? 'Unknown error',
        })
      );
    }
  }, [failedToFetchDepositAddresses, fetchDepositAddressesError?.message, dydxAddress]);

  const chains = useMemo(() => {
    if (selectedTab === 'perpetuals') {
      const evmChains = EVM_DEPOSIT_CHAINS.map((chain) => {
        return chain.id;
      }).filter((chainId) => chainId !== polygon.id); // Polygon unsupported for now

      return [...evmChains, SOLANA_MAINNET_ID];
    }

    return [SOLANA_MAINNET_ID];
  }, [selectedTab]);

  const perpsDepositAddress: string | undefined = useMemo(() => {
    if (depositAddresses == null) {
      return undefined;
    }

    if (selectedChain === avalanche.id.toString()) {
      return depositAddresses.avalancheAddress;
    }

    if (selectedChain === SOLANA_MAINNET_ID) {
      return depositAddresses.svmAddress;
    }

    return depositAddresses.evmAddress;
  }, [depositAddresses, selectedChain]);

  useEffect(() => {
    if (chains[0] == null) {
      return;
    }

    setSelectedChain(chains[0].toString());
  }, [chains]);

  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const isUsdcOnly = CHAIN_INFO[selectedChain]?.gasDenom !== 'ETH';

  const supportedAssets = useMemo(() => {
    if (isUsdcOnly) {
      return [{ icon: ASSET_ICON_MAP.USDC, name: 'USDC' }];
    }
    return [
      { icon: ASSET_ICON_MAP.ETH, name: 'ETH' },
      { icon: ASSET_ICON_MAP.USDC, name: 'USDC' },
    ];
  }, [isUsdcOnly]);

  const warningMessage = useMemo(() => {
    const chainName = CHAIN_INFO[selectedChain]?.name;

    const assets = isUsdcOnly ? 'USDC' : `USDC ${stringGetter({ key: STRING_KEYS.OR })} ETH`;

    const warningMessageParams = calc(() => {
      const maxDeposit = formatNumberOutput(MAX_DEPOSIT, OutputType.CompactNumber, {
        decimalSeparator,
        groupSeparator,
        selectedLocale,
      });

      if (selectedChain === mainnet.id.toString()) {
        return {
          MIN_INSTANT_DEPOSIT: ETH_MIN_INSTANT_DEPOSIT,
          MAX_DEPOSIT: maxDeposit,
        };
      }
      return {
        MIN_INSTANT_DEPOSIT: MIN_DEPOSIT,
        MAX_DEPOSIT: maxDeposit,
      };
    });

    return (
      <AlertMessage withAccentText type={AlertType.Warning} tw="font-small-medium">
        <div tw="row">
          <span>
            {stringGetter({
              key: STRING_KEYS.DEPOSIT_LOSS_OF_FUNDS_WARNING,
              params: {
                ASSETS: <strong>{assets}</strong>,
                NETWORK: <strong>{chainName}</strong>,
                MIN_INSTANT_DEPOSIT: warningMessageParams.MIN_INSTANT_DEPOSIT,
                MAX_DEPOSIT: warningMessageParams.MAX_DEPOSIT,
                LOSS_OF_FUNDS: (
                  <strong>
                    {stringGetter({
                      key: STRING_KEYS.LOSS_OF_FUNDS,
                    })}
                  </strong>
                ),
              },
            })}
          </span>
        </div>
      </AlertMessage>
    );
  }, [selectedChain, isUsdcOnly, stringGetter, decimalSeparator, groupSeparator, selectedLocale]);

  const getAcceptedAssets = (id: string | number) => {
    if (id === SOLANA_MAINNET_ID || id === avalanche.id) {
      return stringGetter({ key: STRING_KEYS.ACCEPTS_ONLY_USDC });
    }

    return stringGetter({
      key: STRING_KEYS.ACCEPTED_ASSETS_AND_USDC,
      params: { ASSETS: CHAIN_INFO[id]?.gasDenom },
    });
  };

  const handleTabChange = useCallback(
    (newTab: 'perps' | 'spot') => {
      if (newTab === selectedTab) return;
      setSelectedTab(newTab === 'perps' ? 'perpetuals' : 'spot');
    },
    [selectedTab]
  );

  useLayoutEffect(() => {
    if (complianceState === ComplianceStates.READ_ONLY) {
      setIsOpen(false);
    } else if (complianceState !== ComplianceStates.FULL_ACCESS) {
      handleTabChange('spot');
    }
  }, [complianceState, handleTabChange, setIsOpen]);

  const perpetualsContent = (
    <div tw="flexColumn gap-1">
      <SelectMenu
        fullWidthPopper
        withPortal={isSimpleUi ? false : undefined}
        tw="h-4 w-full text-color-text-2"
        value={selectedChain}
        onValueChange={setSelectedChain}
        slotTrigger={
          <SelectMenuTrigger
            css={
              isSimpleUi && {
                '--trigger-open-backgroundColor': 'var(--color-layer-2)',
              }
            }
          >
            <$WithLabel label={stringGetter({ key: STRING_KEYS.NETWORK })}>
              <div tw="w-full">{CHAIN_INFO[selectedChain]?.name}</div>
            </$WithLabel>
            <Icon
              iconName={IconName.Triangle}
              tw="h-0.375 min-h-0.375 w-0.625 min-w-0.625 text-color-text-0"
            />
          </SelectMenuTrigger>
        }
        position="popper"
        side="bottom"
        sideOffset={8}
        contentCss={{
          '--popover-backgroundColor': 'var(--color-layer-2)',
        }}
      >
        {chains.map((id) => (
          <$SelectItem
            key={id}
            value={id.toString()}
            withIcon={false}
            label={
              <div tw="row justify-between gap-0.5">
                <div tw="flexColumn gap-0.25">
                  <div>{CHAIN_INFO[id]?.name}</div>
                  <div tw="text-color-text-0 font-small-book">{getAcceptedAssets(id)}</div>
                </div>
                <img
                  tw="size-1.5 rounded-[50%]"
                  src={CHAIN_INFO[id]?.icon}
                  alt={CHAIN_INFO[id]?.name}
                />
              </div>
            }
          />
        ))}
      </SelectMenu>

      <DepositAddressCard
        address={perpsDepositAddress}
        supportedAssets={supportedAssets}
        isLoading={isUploadingAddress || isLoadingDepositAddresses}
        error={failedToFetchDepositAddresses}
        errorMessage={stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })}
      />

      {warningMessage}
    </div>
  );

  const tabs: SpotTabItem[] = [
    {
      value: 'perps',
      label: stringGetter({ key: STRING_KEYS.PERPETUALS }),
      content: perpetualsContent,
      disabled: complianceState !== ComplianceStates.FULL_ACCESS,
    },
    {
      value: 'spot',
      label: stringGetter({ key: STRING_KEYS.SPOT }),
      content: <SpotDepositForm />,
    },
  ];

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
      hasHeaderBorder
    >
      <div tw="h-full w-full overflow-hidden p-1.25">
        <SpotTabs
          value={selectedTab === 'perpetuals' ? 'perps' : 'spot'}
          onValueChange={(v) => handleTabChange(v as 'perps' | 'spot')}
          hideTabs={!isSpotEnabled || !solanaAddress}
          items={tabs}
        />
      </div>
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;

  @media ${breakpoints.notMobile} {
    max-width: 26.25rem;
  }
`;

const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
  border-radius: 0;

  > * {
    ${layoutMixins.textTruncate}
  }
`;

const $SelectItem = styled(SelectItem)`
  span {
    width: 100%;
  }
`;
