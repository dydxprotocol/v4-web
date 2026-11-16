import { useState } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonStyle, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { IconName } from './Icon';
import { IconButton } from './IconButton';
import { SimpleUiBannerAlert } from './TopBanner/SimpleUiBannerAlert';

export const ComplianceBanner = ({
  className,
  slotRight,
}: {
  className?: string;
  slotRight?: React.ReactNode;
}) => {
  const [showLess, setShowLess] = useState(false);
  const stringGetter = useStringGetter();
  const { complianceMessage, showComplianceBanner } = useComplianceState();
  const { isTablet } = useBreakpoints();
  const isSimpleUi = useSimpleUiEnabled();

  if (!showComplianceBanner) {
    return null;
  }

  const toggleShowLess = () => {
    setShowLess((prev) => !prev);
  };

  if (isSimpleUi) {
    return (
      <SimpleUiBannerAlert className={className} type={AlertType.Error}>
        {showLess ? (
          stringGetter({ key: STRING_KEYS.COMPLIANCE_WARNING })
        ) : (
          <div tw="flex flex-col gap-0.5">
            <span>{complianceMessage}</span>
          </div>
        )}
        {slotRight}
        <IconButton
          tw="text-color-text-2"
          type={ButtonType.Button}
          onClick={toggleShowLess}
          iconName={showLess ? IconName.Caret : IconName.Close}
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      </SimpleUiBannerAlert>
    );
  }

  return (
    <$ComplianceBanner className={className}>
      <div tw="absolute inset-0 z-[-1] bg-color-gradient-error" />
      {isTablet && (
        <div
          tw="absolute top-0.25"
          css={{
            right: slotRight != null ? 'calc(var(--top-banner-toggle-width) + 0.25rem)' : '0.25rem',
          }}
        >
          <IconButton
            tw="text-color-text-2"
            type={ButtonType.Button}
            onClick={toggleShowLess}
            iconName={showLess ? IconName.Caret : IconName.Close}
            buttonStyle={ButtonStyle.WithoutBackground}
          />
        </div>
      )}
      {showLess && isTablet ? (
        stringGetter({ key: STRING_KEYS.COMPLIANCE_WARNING })
      ) : (
        <span>{complianceMessage}</span>
      )}
      {slotRight}
    </$ComplianceBanner>
  );
};

const $ComplianceBanner = styled.div`
  height: var(--top-banner-currentHeight);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  grid-area: TopBanner;
  z-index: 1;
  padding: 0.5rem 1rem;

  font: var(--font-small-book);
  border-left: 4px solid var(--color-error);
  background-color: var(--color-layer-2);
  color: var(--color-error);

  @media ${breakpoints.tablet} {
    position: relative;
  }

  a {
    color: var(--color-text-2);
    text-decoration: underline;
  }
`;
