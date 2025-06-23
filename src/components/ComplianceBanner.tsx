import { useState } from 'react';

import { ComplianceStatus } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { ButtonSize, ButtonStyle, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { Button } from './Button';
import { IconName } from './Icon';
import { IconButton } from './IconButton';
import { Link } from './Link';

export const ComplianceBanner = ({ className }: { className?: string }) => {
  const [showLess, setShowLess] = useState(false);
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { complianceMessage, complianceStatus, showComplianceBanner, showRestrictionWarning } =
    useComplianceState();
  const { help } = useURLConfigs();
  const { isTablet } = useBreakpoints();

  if (!showComplianceBanner) {
    return null;
  }

  const complianceContent = showRestrictionWarning ? (
    <span>
      {stringGetter({
        key: STRING_KEYS.BLOCKED_BANNER_MESSAGE_SHORT,
        params: {
          CONTACT_SUPPORT_LINK: (
            <Link href={help} isInline>
              {stringGetter({ key: STRING_KEYS.CONTACT_SUPPORT })}
            </Link>
          ),
        },
      })}{' '}
      <Link href={`${BASE_ROUTE}${AppRoute.Terms}`} isInline>
        {stringGetter({
          key: STRING_KEYS.LEARN_MORE,
        })}{' '}
        →
      </Link>
    </span>
  ) : (
    <span>{complianceMessage}</span>
  );

  const action =
    complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY ? (
      <Button
        tw="w-fit"
        size={isTablet ? ButtonSize.XSmall : ButtonSize.Small}
        onClick={() => {
          dispatch(openDialog(DialogTypes.GeoCompliance()));
        }}
      >
        {stringGetter({ key: STRING_KEYS.ACTION_REQUIRED })} →
      </Button>
    ) : null;

  const toggleShowLess = () => {
    setShowLess((prev) => !prev);
  };

  const canHide = isTablet && action == null;

  return (
    <$ComplianceBanner className={className}>
      <div tw="absolute inset-0 z-[-1] bg-color-gradient-error" />
      {canHide && (
        <IconButton
          tw="absolute right-0.25 top-0.25 text-color-text-2"
          type={ButtonType.Button}
          onClick={toggleShowLess}
          iconName={showLess ? IconName.Caret : IconName.Close}
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      )}

      {showLess && canHide ? (
        stringGetter({ key: STRING_KEYS.COMPLIANCE_WARNING })
      ) : (
        <>
          {complianceContent}
          {action}
        </>
      )}
    </$ComplianceBanner>
  );
};

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
