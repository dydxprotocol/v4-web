import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { TransferType } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { WalletType } from '@/constants/wallets';

import { useAccounts, useEnvFeatures, useStringGetter } from '@/hooks';

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
  const { type, depositOptions, withdrawalOptions } =
    useSelector(getTransferInputs, shallowEqual) || {};
  const chains =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.chains?.toArray() || [];

  const exchanges =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.exchanges?.toArray() ||
    [];

  const cctpTokensByChainId = cctpTokens.reduce((acc, token) => {
    if (!acc[token.chainId]) {
      acc[token.chainId] = [];
    }
    acc[token.chainId].push(token);
    return acc;
  }, {} as Record<string, TokenInfo[]>);

  // withdrawals SourceSelectMenu is half width size so we must throw the decorator text
  // in the description prop (renders below the item label) instead of in the slotAfter
  const lowestFeesDecoratorProp = type === TransferType.deposit ? 'slotAfter' : 'description';

  const chainItems = Object.values(chains)
    .map((chain) => ({
      value: chain.type,
      label: chain.stringKey,
      onSelect: () => {
        onSelect(chain.type, 'chain');
      },
      slotBefore: <$Img src={chain.iconUrl ?? undefined} alt="" />,
      [lowestFeesDecoratorProp]: !!cctpTokensByChainId[chain.type] && (
        <$Text>
          {stringGetter({
            key: STRING_KEYS.LOWEST_FEES_WITH_USDC,
            params: {
              LOWEST_FEES_HIGHLIGHT_TEXT: (
                <$GreenHighlight>
                  {stringGetter({ key: STRING_KEYS.LOWEST_FEES_HIGHLIGHT_TEXT })}
                </$GreenHighlight>
              ),
            },
          })}
        </$Text>
      ),
    }))
    .filter(
      (chain) =>
        type === TransferType.deposit || !!cctpTokensByChainId[chain.value] || !CCTPWithdrawalOnly
    )
    .sort((chain) => (!!cctpTokensByChainId[chain.value] ? -1 : 1));

  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.type,
    label: exchange.string,
    onSelect: () => {
      onSelect(exchange.type, 'exchange');
    },
    slotBefore: <$Img src={exchange.iconUrl ?? undefined} alt="" />,
  }));

  const selectedChainOption = chains.find((item) => item.type === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.type === selectedExchange);
  const isNotPrivyDeposit = type === TransferType.withdrawal || walletType !== WalletType.Privy;

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
const $DropdownContainer = styled.div`
  ${popoverMixins.item}
`;

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

const $Text = styled.div`
  font: var(--font-small-regular);
  color: var(--color-text-0);
`;

const $GreenHighlight = styled.span`
  color: var(--color-green);
`;
