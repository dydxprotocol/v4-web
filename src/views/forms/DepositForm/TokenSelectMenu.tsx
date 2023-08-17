import type { ChainData, TokenData } from '@0xsquid/sdk';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { Tag } from '@/components/Tag';
import { WithLabel } from '@/components/WithLabel';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  chain?: ChainData;
  tokens?: TokenData[];
  sourceToken?: TokenData;
  setSourceToken: (token: TokenData) => void;
};

export const TokenSelectMenu = ({
  tokens = [],
  chain,
  sourceToken,
  setSourceToken,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const tokenItems = Object.values(tokens)
    .filter((token: TokenData) => token.chainId === chain?.chainId)
    .map((token: TokenData) => ({
      value: token.address,
      label: token.name,
      onSelect: () => setSourceToken(token),
      slotBefore: <Styled.Img src={token.logoURI} alt="" />,
    }));

  return (
    <SearchSelectMenu
      disabled={!chain}
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
          value: sourceToken && (
            <>
              <Tag>{sourceToken?.symbol}</Tag>→<Tag>USDC</Tag>
            </>
          ),
          tooltip: 'swap',
          withTooltipIcon: true,
        },
      ]}
    >
      <Styled.AssetRow>
        {sourceToken ? (
          <>
            <Styled.Img src={sourceToken?.logoURI} alt="" /> {sourceToken?.name}{' '}
            <Tag>{sourceToken?.symbol}</Tag>
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
