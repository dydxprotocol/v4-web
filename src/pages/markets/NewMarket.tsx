import { useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';

import { AppRoute } from '@/constants/routes';
import { useAccountBalance, useBreakpoints, useDocumentTitle } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';
import { breakpoints } from '@/styles';

import { Button } from '@/components/Button';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { IconButton } from '@/components/IconButton';
import { Icon, IconName } from '@/components/Icon';
import { NewMarketForm } from '@/views/forms/NewMarketForm';

const HOW_TO_ADD_MARKET_TEXT = [
  {
    step: 1,
    title: 'Select market',
    subtitle:
      'Search or choose from a list of markets you’d like to add. The list is pre-populated with markets that have been deemed “safe” to add to the Protocol. ',
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
  const { isNotTablet } = useBreakpoints();
  const { nativeTokenBalance } = useAccountBalance();
  const navigate = useNavigate();
  const [displaySteps, setDisplaySteps] = useState(true);

  useDocumentTitle('New Market');

  // const { data, isLoading } = useQuery({
  //   queryKey: ['market_proposals'],
  //   queryFn: async () => {
  //     const response = fetch('http://3.134.210.83:1317/cosmos/gov/v1/proposals', {
  //       headers: {
  //         Accept: 'application/json',
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     return (await response).json();
  //   },
  //   refetchInterval: 10_000,
  //   staleTime: 10_000,
  // });

  // console.log(data, isLoading);

  return (
    <Styled.Page>
      <Styled.HeaderSection>
        <Styled.ContentSectionHeader
          title="Suggest a new Market"
          slotRight={
            <IconButton iconName={IconName.Close} onClick={() => navigate(AppRoute.Markets)} />
          }
          subtitle={isNotTablet && 'Add details in order to launch a new market'}
        />
      </Styled.HeaderSection>
      <Styled.Content>
        <div>
          <Button
            slotLeft={<Styled.Icon iconName={displaySteps ? IconName.Hide : IconName.HelpCircle} />}
            onClick={() => setDisplaySteps(!displaySteps)}
          >
            {displaySteps ? 'Hide Steps' : 'Show Steps'}
          </Button>
          {displaySteps && (
            <>
              <h2>Steps to create a new market</h2>
              {HOW_TO_ADD_MARKET_TEXT.map((item) => (
                <StepItem
                  key={item.step}
                  step={item.step}
                  title={item.title}
                  subtitle={item.subtitle}
                />
              ))}
            </>
          )}
          <>
            <h2>Proposals</h2>
          </>
        </div>
        <Styled.FormContainer>
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
  /* align-items: center; */

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

  h2 {
    font: var(--font-large-medium);
    color: var(--color-text-2);
    margin: 1rem;
  }
`;

Styled.Icon = styled(Icon)`
  width: 1.5rem;
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
  font: var(--font-medium-book);
`;

Styled.Subtitle = styled.span`
  color: var(--color-text-0);
`;

Styled.FormContainer = styled.div`
  min-width: 30rem;
  height: fit-content;
  border-radius: 1rem;
  background-color: var(--color-layer-3);
  padding: 1rem;

  @media ${breakpoints.tablet} {
    width: 100%;
  }
`;

export default NewMarket;
