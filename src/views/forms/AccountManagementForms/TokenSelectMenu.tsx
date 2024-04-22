import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvFeatures, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { DiffArrow } from '@/components/DiffArrow';
import { Icon, IconName } from '@/components/Icon';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { Tag } from '@/components/Tag';

import { getTransferInputs } from '@/state/inputsSelectors';

import cctpTokens from '../../../../public/configs/cctp.json';
import { TokenInfo } from './SourceSelectMenu';

type ElementProps = {
  selectedToken?: TransferInputTokenResource;
  onSelectToken: (token: TransferInputTokenResource) => void;
  isExchange?: boolean;
};

export const TokenSelectMenu = ({ selectedToken, onSelectToken, isExchange }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { type, depositOptions, withdrawalOptions, resources } =
    useSelector(getTransferInputs, shallowEqual) || {};
  const { CCTPWithdrawalOnly } = useEnvFeatures();

  const tokens =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.assets?.toArray() || [];

  const cctpTokensByAddress = cctpTokens.reduce((acc, token) => {
    if (!acc[token.tokenAddress]) {
      acc[token.tokenAddress] = [];
    }
    acc[token.tokenAddress].push(token);
    return acc;
  }, {} as Record<string, TokenInfo[]>);

  const tokenItems = Object.values(tokens)
    .map((token) => ({
      value: token.type,
      label: token.stringKey,
      onSelect: () => {
        const selectedToken = resources?.tokenResources?.get(token.type);
        selectedToken && onSelectToken(selectedToken);
      },
      slotBefore: <Styled.Img src={token.iconUrl} alt="" />,
      tag: resources?.tokenResources?.get(token.type)?.symbol,
    }))
    .filter(
      (chain) =>
        type === TransferType.deposit || !!cctpTokensByAddress[chain.value] || !CCTPWithdrawalOnly
    );

  return (
    <SearchSelectMenu
      items={[
        {
          group: 'assets',
          groupLabel: stringGetter({ key: STRING_KEYS.ASSET }),
          items: tokenItems,
        },
      ]}
      label={stringGetter({ key: STRING_KEYS.ASSET })}
      withSearch={!isExchange}
      withReceiptItems={
        !isExchange
          ? [
              {
                key: 'swap',
                label: stringGetter({ key: STRING_KEYS.SWAP }),
                value: selectedToken && (
                  <>
                    <Tag>{type === TransferType.deposit ? selectedToken?.symbol : 'USDC'}</Tag>
                    <DiffArrow />
                    <Tag>{type === TransferType.deposit ? 'USDC' : selectedToken?.symbol}</Tag>
                  </>
                ),
              },
            ]
          : undefined
      }
    >
      <Styled.AssetRow>
        {selectedToken ? (
          <>
            <Styled.Img src={selectedToken?.iconUrl} alt="" /> {selectedToken?.name}{' '}
            <Tag>{selectedToken?.symbol}</Tag>
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_ASSET })
        )}
      </Styled.AssetRow>
    </SearchSelectMenu>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AssetRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  color: var(--color-text-2);
  font: var(--font-base-book);
`;

Styled.Img = styled.img`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
`;

Styled.Icon = styled(Icon)`
  height: 0.5rem;
`;
