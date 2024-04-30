import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { TransferType } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { WalletType } from '@/constants/wallets';

import { useEnvFeatures, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { getTransferInputs } from '@/state/inputsSelectors';

import { isTruthy } from '@/lib/isTruthy';

import cctpTokens from '../../../../public/configs/cctp.json';

type ElementProps = {
  label?: string;
  selectedExchange?: string;
  selectedChain?: string;
  onSelect: (name: string, type: 'chain' | 'exchange') => void;
};

export type TokenInfo = {
  chainId: string;
  tokenAddress: string;
  name: string;
};

export const SourceSelectMenu = ({
  label,
  selectedExchange,
  selectedChain,
  onSelect,
}: ElementProps) => {
  const { walletType } = useAccounts();
  const { CCTPWithdrawalOnly } = useEnvFeatures();

  const stringGetter = useStringGetter();
  const { type, depositOptions, withdrawalOptions, resources } =
    useSelector(getTransferInputs, shallowEqual) || {};
  const chains =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.chains?.toArray() || [];

  const exchanges =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.exchanges?.toArray() ||
    [];

  const cctpTokenssByChainId = cctpTokens.reduce((acc, token) => {
    if (!acc[token.chainId]) {
      acc[token.chainId] = [];
    }
    acc[token.chainId].push(token);
    return acc;
  }, {} as Record<string, TokenInfo[]>);

  const chainItems = Object.values(chains)
    .map((chain) => ({
      value: chain.type,
      label: chain.stringKey,
      onSelect: () => {
        onSelect(chain.type, 'chain');
      },
      slotBefore: <Styled.Img src={chain.iconUrl} alt="" />,
    }))
    .filter(
      (chain) =>
        type === TransferType.deposit || !!cctpTokenssByChainId[chain.value] || !CCTPWithdrawalOnly
    );

  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.type,
    label: exchange.string,
    onSelect: () => {
      onSelect(exchange.type, 'exchange');
    },
    slotBefore: <Styled.Img src={exchange.iconUrl} alt="" />,
  }));

  const selectedChainOption = chains.find((item) => item.type === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.type === selectedExchange);
  const isNotPrivyDeposit = type === TransferType.deposit && walletType !== WalletType.Privy;

  return (
    <SearchSelectMenu
      items={[
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
      label={label || (type === TransferType.deposit ? 'Source' : 'Destination')}
    >
      <Styled.ChainRow>
        {selectedChainOption ? (
          <>
            <Styled.Img src={selectedChainOption.iconUrl} alt="" /> {selectedChainOption.stringKey}
          </>
        ) : selectedExchangeOption ? (
          <>
            <Styled.Img src={selectedExchangeOption.iconUrl} alt="" />{' '}
            {selectedExchangeOption.string}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </Styled.ChainRow>
    </SearchSelectMenu>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DropdownContainer = styled.div`
  ${popoverMixins.item}
`;

Styled.Img = styled.img`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
`;

Styled.ChainRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  color: var(--color-text-2);
  font: var(--font-base-book);
`;
