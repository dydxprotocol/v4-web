import styled, { type AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { useStringGetter } from '@/hooks';

import { DiffArrow } from '@/components/DiffArrow';
import { Icon, IconName } from '@/components/Icon';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { Tag } from '@/components/Tag';

import { layoutMixins } from '@/styles/layoutMixins';

import { getTransferInputs } from '@/state/inputsSelectors';

type ElementProps = {
  selectedToken?: TransferInputTokenResource;
  onSelectToken: (token: TransferInputTokenResource) => void;
};

export const TokenSelectMenu = ({ selectedToken, onSelectToken }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { type, depositOptions, withdrawalOptions, resources } =
    useSelector(getTransferInputs, shallowEqual) || {};
  const tokens =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.assets?.toArray() || [];

  const tokenItems = Object.values(tokens).map((token) => ({
    value: token.type,
    label: token.stringKey,
    onSelect: () => {
      const selectedToken = resources?.tokenResources?.get(token.type);
      selectedToken && onSelectToken(selectedToken);
    },
    slotBefore: <Styled.Img src={token.iconUrl} alt="" />,
  }));

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
      withReceiptItems={[
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
          tooltip: 'swap',
        },
      ]}
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
