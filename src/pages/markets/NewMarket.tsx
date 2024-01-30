import { useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { AppRoute } from '@/constants/routes';

import {
  useBreakpoints,
  useDocumentTitle,
  useGovernanceVariables,
  useStringGetter,
  useTokenConfigs,
} from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { IconButton } from '@/components/IconButton';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { NewMarketForm } from '@/views/forms/NewMarketForm';

import { MustBigNumber } from '@/lib/numbers';

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
  const { newMarketProposal } = useGovernanceVariables();
  const navigate = useNavigate();
  const [displaySteps, setDisplaySteps] = useState(true);
  const stringGetter = useStringGetter();
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.ADD_A_MARKET }));

  const steps = useMemo(() => {
    return [
      {
        step: 1,
        title: stringGetter({ key: STRING_KEYS.ADD_MARKET_STEP_1_TITLE }),
        subtitle: stringGetter({
          key: STRING_KEYS.ADD_MARKET_STEP_1_DESCRIPTION,
          params: {
            HERE: (
              <Styled.Link href={newMarketProposal.newMarketsMethodology}>
                {stringGetter({ key: STRING_KEYS.HERE })}
              </Styled.Link>
            ),
          },
        }),
      },
      {
        step: 2,
        title: stringGetter({ key: STRING_KEYS.ADD_MARKET_STEP_2_TITLE }),
        subtitle: stringGetter({ key: STRING_KEYS.ADD_MARKET_STEP_2_DESCRIPTION }),
      },
      {
        step: 3,
        title: stringGetter({ key: STRING_KEYS.ADD_MARKET_STEP_3_TITLE }),
        subtitle: stringGetter({
          key: STRING_KEYS.ADD_MARKET_STEP_3_DESCRIPTION,
          params: {
            REQUIRED_NUM_TOKENS: MustBigNumber(newMarketProposal?.initialDepositAmount)
              .div(Number(`1e${chainTokenDecimals}`))
              .toFixed(isMainnet ? 0 : chainTokenDecimals),
            NATIVE_TOKEN_DENOM: chainTokenLabel,
          },
        }),
      },
    ];
  }, [stringGetter, newMarketProposal, chainTokenLabel]);

  return (
    <Styled.Page>
      <Styled.HeaderSection>
        <Styled.ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.SUGGEST_NEW_MARKET })}
          slotRight={
            <IconButton iconName={IconName.Close} onClick={() => navigate(AppRoute.Markets)} />
          }
          subtitle={isNotTablet && stringGetter({ key: STRING_KEYS.ADD_DETAILS_TO_LAUNCH_MARKET })}
        />
      </Styled.HeaderSection>
      <Styled.Content>
        <div>
          <Button
            slotLeft={<Styled.Icon iconName={displaySteps ? IconName.Hide : IconName.HelpCircle} />}
            onClick={() => setDisplaySteps(!displaySteps)}
          >
            {displaySteps
              ? stringGetter({ key: STRING_KEYS.HIDE_STEPS })
              : stringGetter({ key: STRING_KEYS.SHOW_STEPS })}
          </Button>
          {displaySteps && (
            <>
              <h2>{stringGetter({ key: STRING_KEYS.STEPS_TO_CREATE })}</h2>
              {steps.map((item) => (
                <StepItem
                  key={item.step}
                  step={item.step}
                  title={item.title}
                  subtitle={item.subtitle}
                />
              ))}
            </>
          )}
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

Styled.Link = styled(Link)`
  --link-color: var(--color-accent);
  display: inline-block;
`;

Styled.FormContainer = styled.div`
  min-width: 31.25rem;
  height: fit-content;
  border-radius: 1rem;
  background-color: var(--color-layer-3);
  padding: 1rem;

  @media ${breakpoints.tablet} {
    width: 100%;
    min-width: unset;
  }
`;

export default NewMarket;
