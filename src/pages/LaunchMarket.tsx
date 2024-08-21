import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';
import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { NewMarketForm } from '@/views/forms/NewMarketForm';

const LaunchMarket = () => {
  const stringGetter = useStringGetter();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.ADD_A_MARKET }));

  const items = [
    {
      key: 'market-cap',
      label: 'Market Cap',
      value: <Output type={OutputType.CompactFiat} tw="text-color-text-1" value={1232604.23} />,
    },
    {
      key: 'max-leverage',
      label: stringGetter({ key: STRING_KEYS.MAXIMUM_LEVERAGE }),
      value: <Output type={OutputType.Multiple} value={5} />,
    },
  ];

  return (
    <$Page>
      <$Content>
        <$FormContainer>
          <NewMarketForm />
        </$FormContainer>

        <div tw="flex h-fit w-[25rem] flex-col gap-1 rounded-[1rem] border-[length:--border-width] border-color-border p-1.5 [border-style:solid]">
          <div id="header" tw="flex flex-row items-center justify-between">
            <div tw="flex flex-row items-center gap-0.5">
              <AssetIcon tw="h-2.5 w-2.5" symbol="ETH" />
              <h2 tw="flex flex-row items-center gap-[0.5ch] text-extra text-color-text-1">
                Ethereum
                <LinkOutIcon tw="h-1.25 w-1.25" />
              </h2>
            </div>
            <Tag>ETH</Tag>
          </div>

          <div tw="flex flex-row justify-between">
            <Details
              layout="rowColumns"
              items={[
                {
                  key: 'reference-price',
                  label: stringGetter({ key: STRING_KEYS.REFERENCE_PRICE }),
                  tooltip: 'reference-price',
                  value: <Output type={OutputType.Fiat} tw="text-color-text-1" value={2604.23} />,
                },
              ]}
            />
          </div>

          <div tw="h-[8.75rem] rounded-[1rem] border-[length:--border-width] border-color-border p-1.5 [border-style:solid]" />

          <Details layout="rowColumns" items={items} />
        </div>
      </$Content>
    </$Page>
  );
};
const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;
  padding: 2.5rem 0;

  > * {
    --content-max-width: 80rem;
    max-width: min(calc(100vw - 4rem), var(--content-max-width));
  }

  @media ${breakpoints.tablet} {
    --stickyArea-topHeight: var(--page-header-height-mobile);
    padding: 0 1rem 1rem;

    > * {
      max-width: calc(100vw - 2rem);
      width: 100%;
    }
  }
`;

const $Content = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  margin: 0 auto;

  @media ${breakpoints.tablet} {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0 auto;
  }
`;

const $FormContainer = styled.div`
  width: 25rem;
  height: fit-content;
  border-radius: 1rem;
  background-color: var(--color-layer-3);
  padding: 1.5rem;

  @media ${breakpoints.tablet} {
    width: 100%;
    min-width: unset;
  }
`;

export default LaunchMarket;
