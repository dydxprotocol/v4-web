import { Chain } from '@skip-go/client';
import tw from 'twin.macro';

import { cctpTokensByChainId, isHighFeeChainId, isLowFeeChainId } from '@/constants/cctp';
import { SUPPORTED_COSMOS_CHAINS } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { MenuItem } from '@/constants/menus';
import { TransferType } from '@/constants/transfers';
import { WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { isTruthy } from '@/lib/isTruthy';

import exchanges from '../../../../../public/configs/exchanges.json';
import { FeeLevelTag } from '../FeeLevelTag';

type ElementProps = {
  selectedExchange?: string;
  selectedChain?: string;
  onSelectNetwork: (chainID: string) => void;
  onSelectExchange: (exchangeName: 'coinbase') => void;
  chains: Chain[];
};

export const NetworkSelectMenu = ({
  selectedExchange,
  selectedChain,
  onSelectNetwork,
  onSelectExchange,
  chains,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();

  const getFeeDecoratorComponentForChainId = (chainId: string) => {
    if (isLowFeeChainId(chainId, TransferType.Withdraw)) return <FeeLevelTag feeLevel="low" />;
    if (isHighFeeChainId(chainId, TransferType.Withdraw)) return <FeeLevelTag feeLevel="high" />;
    return undefined;
  };

  const chainItems = chains
    .map((chain) => ({
      value: chain.chainID,
      label: chain.prettyName,
      onSelect: () => {
        onSelectNetwork(chain.chainID);
      },
      slotBefore: <$Img src={chain.logoURI ?? undefined} alt="" />,
      slotAfter: getFeeDecoratorComponentForChainId(chain.chainID),
    }))
    .filter((chain) => {
      return !!cctpTokensByChainId[chain.value] || SUPPORTED_COSMOS_CHAINS.includes(chain.value);
    });

  const { lowFeeChains, nonLowFeeChains } = chainItems.reduce(
    (allChains, nextChain) => {
      if (isLowFeeChainId(nextChain.value, TransferType.Withdraw))
        allChains.lowFeeChains.push(nextChain);
      else allChains.nonLowFeeChains.push(nextChain);
      return allChains;
    },
    { lowFeeChains: [], nonLowFeeChains: [] } as {
      lowFeeChains: MenuItem<string>[];
      nonLowFeeChains: MenuItem<string>[];
    }
  );

  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.name,
    label: exchange.label,
    onSelect: () => {
      // TODO: remove typecast once we add more exchanges
      onSelectExchange(exchange.name as 'coinbase');
    },
    slotBefore: <$Img src={exchange.icon} alt="" />,
    slotAfter: <FeeLevelTag feeLevel="low" />,
  }));
  const selectedChainOption = chains.find((item) => item.chainID === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.name === selectedExchange);

  const items = [
    {
      group: 'low-fees',
      groupLabel: 'Low Fees',
      items: [...exchangeItems, ...lowFeeChains],
    },
    {
      group: 'other-chains',
      groupLabel: 'Other Chains',
      items: nonLowFeeChains,
    },
  ];
  const isPrivyDeposit = sourceAccount.walletInfo?.name === WalletType.Privy;

  return (
    <SearchSelectMenu items={items.filter(isTruthy)} label="Chain" disabled={isPrivyDeposit}>
      <div tw="row gap-0.5 text-color-text-2 font-base-book">
        {selectedChainOption ? (
          <>
            <$Img src={selectedChainOption.logoURI ?? undefined} alt="" />{' '}
            {selectedChainOption.prettyName}
          </>
        ) : selectedExchangeOption ? (
          <>
            <$Img src={selectedExchangeOption.icon} alt="" /> {selectedExchangeOption.label}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </div>
    </SearchSelectMenu>
  );
};

const $Img = tw.img`h-1.25 w-1.25 rounded-[50%]`;
