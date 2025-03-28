import { useState } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { LaunchableMarketChart } from '@/views/charts/LaunchableMarketChart';
import { NewMarketForm } from '@/views/forms/NewMarketForm';

const LaunchMarket = () => {
  const stringGetter = useStringGetter();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.LAUNCH_A_MARKET }));
  const [tickerToAdd, setTickerToAdd] = useState<string>();

  return (
    <$Page>
      <$Content>
        <$FormContainer>
          <NewMarketForm updateTickerToAdd={setTickerToAdd} />
        </$FormContainer>
        <LaunchableMarketChart ticker={tickerToAdd} />
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
    padding: 0;

    > * {
      max-width: 100vw;
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
    margin: 0;
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
    border-radius: 0;
  }
`;

export default LaunchMarket;
