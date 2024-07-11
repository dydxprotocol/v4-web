import { useMemo } from 'react';

import { StatSigFlags } from '@/types/statsig';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { TransferType } from '@/constants/abacus';
import {
  cctpTokensByChainId,
  getMapOfHighestFeeTokensByChainId,
  getMapOfLowestFeeTokensByChainId,
} from '@/constants/cctp';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import { SUPPORTED_COSMOS_CHAINS } from '@/lib/graz';
import { isTruthy } from '@/lib/isTruthy';

import { HighestFeesDecoratorText } from './HighestFeesText';
import { LowestFeesDecoratorText } from './LowestFeesText';

type ElementProps = {
  label?: string;
  selectedExchange?: string;
  selectedChain?: string;
  onSelect: (name: string, type: 'chain' | 'exchange') => void;
};

export const SourceSelectMenu = ({
  label,
  selectedExchange,
  selectedChain,
  onSelect,
}: ElementProps) => {
  const { walletType } = useAccounts();
  const { CCTPWithdrawalOnly, CCTPDepositOnly } = useEnvFeatures();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const stringGetter = useStringGetter();
  const { type, depositOptions, withdrawalOptions } =
    useAppSelector(getTransferInputs, shallowEqual) ?? {};

  const isNotPrivyDeposit = type === TransferType.withdrawal || walletType !== WalletType.Privy;
  const isNotKeplrWallet = walletType !== WalletType.Keplr;

  const options = type === TransferType.deposit ? depositOptions : withdrawalOptions;

  const chains = options?.chains?.toArray() ?? EMPTY_ARR;
  const exchanges = options?.exchanges?.toArray() ?? EMPTY_ARR;

  const skipEnabled = useStatsigGateValue(StatSigFlags.ffSkipMigration);

  const lowestFeeTokensByChainId = useMemo(
    () => getMapOfLowestFeeTokensByChainId(type, skipEnabled),
    [type, skipEnabled]
  );

  const highestFeeTokensByChainId = useMemo(
    () => getMapOfHighestFeeTokensByChainId(type, skipEnabled),
    [type, skipEnabled]
  );

  // withdrawals SourceSelectMenu is half width size so we must throw the decorator text
  // in the description prop (renders below the item label) instead of in the slotAfter
  const feesDecoratorProp = type === TransferType.deposit ? 'slotAfter' : 'description';

  const getFeeDecoratorComponentForChainId = (chainId: string) => {
    if (lowestFeeTokensByChainId[chainId]) return <LowestFeesDecoratorText />;
    if (highestFeeTokensByChainId[chainId]) return <HighestFeesDecoratorText />;
    return null;
  };

  const chainItems = Object.values(chains)
    .map((chain) => ({
      value: chain.type,
      label: chain.stringKey,
      onSelect: () => {
        onSelect(chain.type, 'chain');
      },
      slotBefore: <$Img src={chain.iconUrl ?? undefined} alt="" />,
      [feesDecoratorProp]: getFeeDecoratorComponentForChainId(chain.type),
    }))
    .filter((chain) => {
      if (!isNotKeplrWallet) {
        return selectedDydxChainId !== chain.value && SUPPORTED_COSMOS_CHAINS.includes(chain.value);
      }
      // if deposit and CCTPDepositOnly enabled, only return cctp tokens
      if (type === TransferType.deposit && CCTPDepositOnly) {
        return !!cctpTokensByChainId[chain.value];
      }
      // if withdrawal and CCTPWithdrawalOnly enabled, only return cctp tokens
      if (type === TransferType.withdrawal && CCTPWithdrawalOnly) {
        return !!cctpTokensByChainId[chain.value];
      }
      return true;
    })
    // we want lowest fee tokens first followed by non-lowest fee cctp tokens
    .sort((chain) => (cctpTokensByChainId[chain.value] ? -1 : 1));

  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.type,
    label: exchange.string,
    onSelect: () => {
      onSelect(exchange.type, 'exchange');
    },
    slotBefore: <$Img src={exchange.iconUrl ?? undefined} alt="" />,
    [feesDecoratorProp]: <LowestFeesDecoratorText />,
  }));

  const selectedChainOption = chains.find((item) => item.type === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.type === selectedExchange);

  return (
    <SearchSelectMenu
      items={[
        isNotKeplrWallet &&
          exchangeItems.length > 0 && {
            group: 'exchanges',
            groupLabel: stringGetter({ key: STRING_KEYS.EXCHANGES }),
            items: exchangeItems,
          },
        // only block privy wallets for deposits
        isNotPrivyDeposit &&
          chainItems.length > 0 && {
            group: 'chains',
            groupLabel: stringGetter({ key: STRING_KEYS.CHAINS }),
            items: chainItems,
          },
      ].filter(isTruthy)}
      label={label ?? (type === TransferType.deposit ? 'Source' : 'Destination')}
    >
      <$ChainRow>
        {selectedChainOption ? (
          <>
            <$Img src={selectedChainOption.iconUrl ?? undefined} alt="" />{' '}
            {selectedChainOption.stringKey}
          </>
        ) : selectedExchangeOption ? (
          <>
            <$Img src={selectedExchangeOption.iconUrl ?? undefined} alt="" />{' '}
            {selectedExchangeOption.string}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </$ChainRow>
    </SearchSelectMenu>
  );
};

const $Img = styled.img`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
`;

const $ChainRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  color: var(--color-text-2);
  font: var(--font-base-book);
`;
