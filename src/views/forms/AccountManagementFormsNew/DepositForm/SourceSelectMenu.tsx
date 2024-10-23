import { Chain } from '@skip-go/client';

import { GRAZ_CHAINS } from '@/constants/graz';

import { useAccounts } from '@/hooks/useAccounts';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { WalletIcon } from '@/components/WalletIcon';

import { convertBech32Address } from '@/lib/addressUtils';

import exchanges from '../../../../../public/configs/exchanges.json';

type ElementProps = {
  onSelectExchange: (exchangeName: string) => void;
  onSelectSource: (sourceAddress: string) => void;
  selectedExchangeName: string;
  selectedWalletAddress: string;
  chainsByChainId: { [key: string]: Chain };
};

export const SourceSelectMenu = ({
  onSelectExchange,
  onSelectSource,
  selectedExchangeName,
  selectedWalletAddress,
  chainsByChainId,
}: ElementProps) => {
  const { sourceAccount } = useAccounts();
  const sourceAddress = sourceAccount.address;
  const sourceWalletInfo = sourceAccount.walletInfo;
  // If user not connected, do not render anything
  if (!sourceAddress || !sourceWalletInfo) return null;
  const connectedWalletItems =
    // For keplr there are several possible addresses, make them each a source
    sourceAccount.chain === 'cosmos'
      ? GRAZ_CHAINS.map((chain) => ({
          value: convertBech32Address({
            address: sourceAddress,
            bech32Prefix: chain.bech32Config.bech32PrefixAccAddr,
          }),
          label: chainsByChainId[chain.chainId]?.prettyName,
        }))
      : [
          {
            value: sourceAddress,
            label: 'Connected Wallet',
            onSelect: () => onSelectSource(sourceAddress),
          },
        ];
  const exchangeItems = [
    {
      value: 'coinbase',
      label: 'Coinbase',
      onSelect: () => onSelectExchange('coinbase'),
    },
  ];

  const sourceItems = connectedWalletItems.concat(exchangeItems);
  const selectedWalletOption = connectedWalletItems.find((w) => w.value === selectedWalletAddress);
  const selectedExchangeOption = exchanges.find((e) => e.name === selectedExchangeName);
  const renderSelectedOption = () => {
    if (selectedWalletOption) {
      return (
        <>
          <WalletIcon wallet={sourceWalletInfo} />
          {selectedWalletOption.label}
        </>
      );
    }
    if (selectedExchangeOption) {
      return (
        <>
          <img tw="h-1.25 w-1.25 rounded-[50%]" alt="" src={selectedExchangeOption.icon} />
          {selectedExchangeOption.label}
        </>
      );
    }
    // TODO [onboarding-rewrite]: localize
    return 'Select Source';
  };
  return (
    <SearchSelectMenu
      items={[
        {
          group: 'sources',
          items: sourceItems,
        },
      ]}
      withSearch
      alternateSearchInputComponent
    >
      {renderSelectedOption()}
    </SearchSelectMenu>
  );
};
