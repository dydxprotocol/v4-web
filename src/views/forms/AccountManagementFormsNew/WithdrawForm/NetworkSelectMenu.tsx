import { useMemo } from 'react';

import { Chain } from '@skip-go/client';
import tw from 'twin.macro';

import {
  cctpTokensByChainId,
  getMapOfHighestFeeTokensByChainId,
  getMapOfLowestFeeTokensByChainId,
} from '@/constants/cctp';
import { SUPPORTED_COSMOS_CHAINS } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TransferType } from '@/constants/transfers';
import { ConnectorType, WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';

import exchanges from '../../../../../public/configs/exchanges.json';
import { HighestFeesDecoratorText } from '../HighestFeesText';
import { LowestFeesDecoratorText } from '../LowestFeesText';

type ElementProps = {
  selectedExchange?: string;
  selectedChain?: string;
  onSelect: (name: string, type: 'chain' | 'exchange') => void;
  chains: Chain[];
};

const solanaChainIdPrefix = 'solana';

export const NetworkSelectMenu = ({
  selectedExchange,
  selectedChain,
  onSelect,
  chains,
}: ElementProps) => {
  const { sourceAccount } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { CCTPWithdrawalOnly } = useEnvFeatures();

  const stringGetter = useStringGetter();

  // TODO: align the types
  const lowestFeeTokensByChainId = useMemo(
    () => getMapOfLowestFeeTokensByChainId(TransferType.Withdraw),
    []
  );

  const highestFeeTokensByChainId = useMemo(
    () => getMapOfHighestFeeTokensByChainId(TransferType.Withdraw),
    []
  );
  const isKeplrWallet = sourceAccount.walletInfo?.name === WalletType.Keplr;

  const getFeeDecoratorComponentForChainId = (chainId: string) => {
    if (lowestFeeTokensByChainId[chainId]) return <LowestFeesDecoratorText />;
    if (highestFeeTokensByChainId[chainId]) return <HighestFeesDecoratorText />;
    return null;
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
      // only cosmos chains are supported on kepler
      if (isKeplrWallet) {
        return selectedDydxChainId !== chain.value && SUPPORTED_COSMOS_CHAINS.includes(chain.value);
      }
      // only solana chains are supported on phantom
      if (sourceAccount.walletInfo?.connectorType === ConnectorType.PhantomSolana) {
        return selectedDydxChainId !== chain.value && chain.value.startsWith(solanaChainIdPrefix);
      }
      // other wallets do not support solana
      if (chain.value.startsWith(solanaChainIdPrefix)) return false;

      if (CCTPWithdrawalOnly) {
        return !!cctpTokensByChainId[chain.value];
      }

      return true;
    })
    // we want lowest fee tokens first followed by non-lowest fee cctp tokens
    .sort((chain) => (cctpTokensByChainId[chain.value] ? -1 : 1))
    .sort((chain) => (lowestFeeTokensByChainId[chain.value] ? -1 : 1));

  // TODO: actually configure exchanges
  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.name,
    label: exchange.label,
    onSelect: () => {
      onSelect(exchange.name, 'exchange');
    },
    slotBefore: <$Img src={exchange.icon ?? undefined} alt="" />,
    slotAfter: <LowestFeesDecoratorText />,
  }));
  const selectedChainOption = chains.find((item) => item.chainID === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.name === selectedExchange);

  return (
    <SearchSelectMenu
      items={[
        !isKeplrWallet &&
          exchangeItems.length > 0 && {
            group: 'exchanges',
            groupLabel: stringGetter({ key: STRING_KEYS.EXCHANGES }),
            items: exchangeItems,
          },
        chainItems.length > 0 && {
          group: 'chains',
          groupLabel: stringGetter({ key: STRING_KEYS.CHAINS }),
          items: chainItems,
        },
      ].filter(isTruthy)}
      label="Destination"
    >
      <div tw="row gap-0.5 text-color-text-2 font-base-book">
        {selectedChainOption ? (
          <>
            <$Img src={selectedChainOption.logoURI ?? undefined} alt="" />{' '}
            {selectedChainOption.chainName}
          </>
        ) : selectedExchangeOption ? (
          <>
            <$Img src={selectedExchangeOption.icon ?? undefined} alt="" />{' '}
            {selectedExchangeOption.name}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </div>
    </SearchSelectMenu>
  );
};

const $Img = tw.img`h-1.25 w-1.25 rounded-[50%]`;
