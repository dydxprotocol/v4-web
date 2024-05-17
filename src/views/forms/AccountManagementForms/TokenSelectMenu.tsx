import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { DiffArrow } from '@/components/DiffArrow';
import { Icon } from '@/components/Icon';
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

const CURVE_DAO_TOKEN_ADDRESS = '0xD533a949740bb3306d119CC777fa900bA034cd52';

const cctpTokensByAddress = cctpTokens.reduce((acc, token) => {
  if (!acc[token.tokenAddress]) {
    acc[token.tokenAddress] = [];
  }
  acc[token.tokenAddress].push(token);
  return acc;
}, {} as Record<string, TokenInfo[]>);

export const TokenSelectMenu = ({ selectedToken, onSelectToken, isExchange }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { type, depositOptions, withdrawalOptions, resources } =
    useSelector(getTransferInputs, shallowEqual) || {};
  const { CCTPWithdrawalOnly, CCTPDepositOnly } = useEnvFeatures();

  const tokens =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.assets?.toArray() || [];

  const tokenItems = Object.values(tokens)
    .map((token) => ({
      value: token.type,
      label: token.stringKey,
      onSelect: () => {
        const selectedToken = resources?.tokenResources?.get(token.type);
        selectedToken && onSelectToken(selectedToken);
      },
      slotBefore: (
        // the curve dao token svg causes the web app to lag when rendered
        <$Img
          src={token.type !== CURVE_DAO_TOKEN_ADDRESS ? token.iconUrl ?? undefined : undefined}
          alt=""
        />
      ),
      slotAfter: !!cctpTokensByAddress[token.type] && (
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
      tag: resources?.tokenResources?.get(token.type)?.symbol,
    }))
    .filter((token) => {
      // if deposit and CCTPDepositOnly enabled, only return cctp tokens
      if (type === TransferType.deposit && CCTPDepositOnly) {
        return !!cctpTokensByAddress[token.value];
      }
      // if withdrawal and CCTPWithdrawalOnly enabled, only return cctp tokens
      if (type === TransferType.withdrawal && CCTPWithdrawalOnly) {
        return !!cctpTokensByAddress[token.value];
      }
      return true;
    })
    .sort((token) => (cctpTokensByAddress[token.value] ? -1 : 1));

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
      <$AssetRow>
        {selectedToken ? (
          <>
            <$Img src={selectedToken?.iconUrl ?? undefined} alt="" /> {selectedToken?.name}{' '}
            <Tag>{selectedToken?.symbol}</Tag>
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_ASSET })
        )}
      </$AssetRow>
    </SearchSelectMenu>
  );
};
const $Text = styled.div`
  font: var(--font-small-regular);
  color: var(--color-text-0);
`;

const $GreenHighlight = styled.span`
  color: var(--color-green);
`;

const $AssetRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  color: var(--color-text-2);
  font: var(--font-base-book);
`;

const $Img = styled.img`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
`;

const $Icon = styled(Icon)`
  height: 0.5rem;
`;
