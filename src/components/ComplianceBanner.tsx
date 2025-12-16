import { useRef, useState } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonStyle, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { usePerpetualsComplianceState } from '@/hooks/usePerpetualsComplianceState';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { AlertMessage } from './AlertMessage';
import { IconName } from './Icon';
import { IconButton } from './IconButton';
import { TermsOfUseLink } from './TermsOfUseLink';

export const ComplianceBanner = ({ className }: { className?: string }) => {
  const [showLess, setShowLess] = useState(false);
  const complianceBannerRef = useRef<HTMLDivElement>(null);
  const stringGetter = useStringGetter();
  const { complianceMessage, showComplianceBanner, showRestrictionWarning } =
    usePerpetualsComplianceState();
  const { isTablet } = useBreakpoints();
  const isSimpleUi = useSimpleUiEnabled();

  useResizeObserver({
    box: 'border-box',
    ref: complianceBannerRef,
    onResize: (size) => {
      if (size.height) {
        document.documentElement.style.setProperty('--complianceBanner-height', `${size.height}px`);
      }
    },
  });

  if (!showComplianceBanner) {
    return null;
  }

  const complianceContent = showRestrictionWarning ? (
    <span>
      {stringGetter({
        key: STRING_KEYS.PERPETUALS_UNAVAILABLE_MESSAGE,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline tw="underline" />,
        },
      })}
    </span>
  ) : (
    <span>{complianceMessage}</span>
  );

  const toggleShowLess = () => {
    setShowLess((prev) => !prev);
  };

  if (isSimpleUi) {
    return (
      <$AlertMessage
        className={className}
        ref={complianceBannerRef}
        withAccentText
        type={AlertType.Error}
      >
        {showLess ? (
          stringGetter({ key: STRING_KEYS.COMPLIANCE_WARNING })
        ) : (
          <div tw="flex flex-col gap-0.5">{complianceContent}</div>
        )}

        <IconButton
          tw="text-color-text-2"
          type={ButtonType.Button}
          onClick={toggleShowLess}
          iconName={showLess ? IconName.Caret : IconName.Close}
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      </$AlertMessage>
    );
  }

  return (
    <$ComplianceBanner className={className}>
      <div tw="absolute inset-0 z-[-1] bg-color-gradient-error" />
      {isTablet && (
        <IconButton
          tw="absolute right-0.25 top-0.25 text-color-text-2"
          type={ButtonType.Button}
          onClick={toggleShowLess}
          iconName={showLess ? IconName.Caret : IconName.Close}
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      )}

      {showLess && isTablet
        ? stringGetter({ key: STRING_KEYS.COMPLIANCE_WARNING })
        : complianceContent}
    </$ComplianceBanner>
  );
};

const $AlertMessage = styled(AlertMessage)`
  border-radius: 0.5rem;
  max-width: 100%;
  margin: 0.75rem 0.75rem 0 0.75rem;
  font: var(--font-base-book);
  grid-auto-flow: column;
`;

const $ComplianceBanner = styled.div`
  height: var(--restriction-warning-currentHeight);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  grid-area: RestrictionWarning;
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
