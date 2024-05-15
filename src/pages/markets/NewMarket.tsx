import { useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

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
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { NewMarketForm } from '@/views/forms/NewMarketForm';

import { MustBigNumber } from '@/lib/numbers';

const StepItem = ({
  step,
  subtitle,
  title,
}: {
  step: number;
  subtitle: React.ReactNode;
  title: string;
}) => (
  <$StepItem>
    <$StepNumber>{step}</$StepNumber>
    <$Column>
      <$Title>{title}</$Title>
      <$Subtitle>{subtitle}</$Subtitle>
    </$Column>
  </$StepItem>
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
              <$Link href={newMarketProposal.newMarketsMethodology}>
                {stringGetter({ key: STRING_KEYS.HERE })}
              </$Link>
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
    <$Page>
      <$HeaderSection>
        <$ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.SUGGEST_NEW_MARKET })}
          slotRight={
            <IconButton iconName={IconName.Close} onClick={() => navigate(AppRoute.Markets)} />
          }
          subtitle={isNotTablet && stringGetter({ key: STRING_KEYS.ADD_DETAILS_TO_LAUNCH_MARKET })}
        />
      </$HeaderSection>
      <$Content>
        <div>
          <Button
            slotLeft={<$Icon iconName={displaySteps ? IconName.Hide : IconName.HelpCircle} />}
            onClick={() => setDisplaySteps(!displaySteps)}
          >
            {displaySteps
              ? stringGetter({ key: STRING_KEYS.HIDE_STEPS })
              : stringGetter({ key: STRING_KEYS.SHOW_STEPS })}
          </Button>
          {displaySteps && (
            <>
              <$StepsTitle>{stringGetter({ key: STRING_KEYS.STEPS_TO_CREATE })}</$StepsTitle>
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
        <$FormContainer>
          <NewMarketForm />
        </$FormContainer>
      </$Content>
    </$Page>
  );
};
const $Page = styled.div`
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

const $ContentSectionHeader = styled(ContentSectionHeader)`
  @media ${breakpoints.notTablet} {
    padding: 1rem;
  }

  @media ${breakpoints.tablet} {
    padding: 1.25rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;

const $HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 0.5rem;
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

const $StepsTitle = styled.h2`
  font: var(--font-large-medium);
  color: var(--color-text-2);
  margin: 1rem;

  @media ${breakpoints.tablet} {
    margin: 1rem 0;
  }
`;

const $Icon = styled(Icon)`
  margin-right: 0.5ch;
`;

const $StepItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const $StepNumber = styled.div`
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

const $Column = styled.div`
  display: flex;
  flex-direction: column;
`;

const $Title = styled.span`
  color: var(--color-text-2);
  font: var(--font-medium-book);
`;

const $Subtitle = styled.span`
  color: var(--color-text-0);
`;

const $Link = styled(Link)`
  --link-color: var(--color-accent);
  display: inline-block;
`;

const $FormContainer = styled.div`
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
