import { Chain } from '@skip-go/client';
import tw from 'twin.macro';

import { cctpTokensByChainId, isHighFeeChainId, isLowFeeChainId } from '@/constants/cctp';
import { STRING_KEYS } from '@/constants/localization';
import { MenuItem } from '@/constants/menus';
import { TransferType } from '@/constants/transfers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { isTruthy } from '@/lib/isTruthy';

import exchanges from '../../../../../public/configs/exchanges.json';
import { FeeLevelTag } from '../FeeLevelTag';

type ElementProps = {
  selectedExchange?: string;
  selectedChain?: string;
  onSelect: (name: string, type: 'chain' | 'exchange') => void;
  chains: Chain[];
};

const DEFAULT_NETWORKS_LABEL = 'Networks';

export const NetworkSelectMenu = ({
  selectedExchange,
  selectedChain,
  onSelect,
  chains,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const getFeeDecoratorComponentForChainId = (chainId: string) => {
    if (isLowFeeChainId(chainId, TransferType.Withdraw)) return <FeeLevelTag feeLevel="low" />;
    if (isHighFeeChainId(chainId, TransferType.Withdraw)) return <FeeLevelTag feeLevel="high" />;
    return undefined;
  };

  const chainItems = chains
    .map((chain) => ({
      value: chain.chainID,
      label: chain.chainName,
      onSelect: () => {
        onSelect(chain.chainID, 'chain');
      },
      slotBefore: <$Img src={chain.logoURI ?? undefined} alt="" />,
      slotAfter: getFeeDecoratorComponentForChainId(chain.chainID),
    }))
    .filter((chain) => {
      return !!cctpTokensByChainId[chain.value];
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

  // TODO [onboarding-rewrite]: configure exchanges
  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.name,
    label: exchange.label,
    onSelect: () => {
      onSelect(exchange.name, 'exchange');
    },
    slotBefore: <$Img src={exchange.icon} alt="" />,
    slotAfter: <FeeLevelTag feeLevel="low" />,
  }));
  const selectedChainOption = chains.find((item) => item.chainID === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.name === selectedExchange);

  // If there's only one group, no need to differentiate between Low Fee or not
  const items = [
    lowFeeChains.length && {
      group: 'low-fees',
      groupLabel: nonLowFeeChains.length ? 'Low Fees' : DEFAULT_NETWORKS_LABEL,
      items: [...exchangeItems, ...lowFeeChains],
    },
    nonLowFeeChains.length && {
      group: 'other-networks',
      groupLabel: lowFeeChains.length ? 'Other networks' : DEFAULT_NETWORKS_LABEL,
      items: nonLowFeeChains,
    },
  ];

  return (
    <SearchSelectMenu items={items.filter(isTruthy)} label="Destination">
      <div tw="row gap-0.5 text-color-text-2 font-base-book">
        {selectedChainOption ? (
          <>
            <$Img src={selectedChainOption.logoURI ?? undefined} alt="" />{' '}
            {selectedChainOption.chainName}
          </>
        ) : selectedExchangeOption ? (
          <>
            <$Img src={selectedExchangeOption.icon} alt="" /> {selectedExchangeOption.name}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </div>
    </SearchSelectMenu>
  );
};

const $Img = tw.img`h-1.25 w-1.25 rounded-[50%]`;
