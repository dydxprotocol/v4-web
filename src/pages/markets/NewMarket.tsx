import styled, { AnyStyledComponent } from 'styled-components';

import { breakpoints } from '@/styles';

import { useAccountBalance, useBreakpoints, useDocumentTitle, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { NewMarketForm } from '@/views/forms/NewMarketForm';

const HOW_TO_ADD_MARKET_TEXT = [
  {
    step: 1,
    title: 'Select market',
    subtitle: "Search or choose from a list of markets you'd like to add",
  },
  {
    step: 2,
    title: 'Confirm details',
    subtitle:
      'Once a market is selected, the Reference Price, Oracles, and Liquidity Tier will be populated.',
  },
  {
    step: 3,
    title: 'Propose new market',
    subtitle:
      'Sign a transaction that creates a proposal to add the new asset to dYdX Chain. This requires a balance of 10,000 DYDX.',
  },
];

const StepItem = ({ step, subtitle, title }: { step: number; subtitle: string; title: string }) => (
  <Styled.StepItem>
    <Styled.StepNumber>{step}</Styled.StepNumber>
    <Styled.Column>
      <Styled.Title>{title}</Styled.Title>
      <Styled.Subtitle>{subtitle}</Styled.Subtitle>
    </Styled.Column>
  </Styled.StepItem>
);

const NewMarket = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();
  const { nativeTokenBalance } = useAccountBalance();

  useDocumentTitle('New Market');

  return (
    <Styled.Page>
      <Styled.HeaderSection>
        <Styled.ContentSectionHeader
          title="Suggest a new Market"
          subtitle={isNotTablet && 'Add details in order to launch a new market'}
        />
      </Styled.HeaderSection>
      <Styled.Content>
        <div>
          <h2>Steps to create a new market</h2>
          {/* <div>{nativeTokenBalance.toString()}</div> */}

          {HOW_TO_ADD_MARKET_TEXT.map((item) => (
            <StepItem
              key={item.step}
              step={item.step}
              title={item.title}
              subtitle={item.subtitle}
            />
          ))}
        </div>
        <Styled.FormContainer>
          <h2>Add Market</h2>
          <NewMarketForm />
        </Styled.FormContainer>
      </Styled.Content>
    </Styled.Page>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;

  @media ${breakpoints.tablet} {
    gap: 0.75rem;
  }
`;

Styled.ContentSectionHeader = styled(ContentSectionHeader)`
  @media ${breakpoints.tablet} {
    padding: 1.25rem 1.875rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;

Styled.HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 0.5rem;
  }
`;

Styled.Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  gap: 1rem;

  h2 {
    font: var(--font-large-medium);
    color: var(--color-text-2);
    margin-bottom: 1rem;
  }
`;

Styled.StepItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
`;

Styled.StepNumber = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  min-width: 2.5rem;
  min-height: 2.5rem;
  border-radius: 50%;
  background-color: var(--color-layer-5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-2);
`;

Styled.Column = styled.div`
  display: flex;
  flex-direction: column;
`;

Styled.Title = styled.span`
  color: var(--color-text-2);
`;

Styled.Subtitle = styled.span`
  color: var(--color-text-1);
`;

Styled.FormContainer = styled.div`
  border-radius: 1rem;
  background-color: var(--color-layer-4);
  padding: 1rem;
`;

export default NewMarket;
