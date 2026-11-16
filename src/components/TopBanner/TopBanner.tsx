import { useState } from 'react';

import styled, { css } from 'styled-components';

import { ButtonStyle, ButtonType } from '@/constants/buttons';

import { useComplianceState } from '@/hooks/useComplianceState';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { layoutMixins } from '@/styles/layoutMixins';

import { ComplianceBanner } from '../ComplianceBanner';
import { Icon, IconName } from '../Icon';
import { IconButton } from '../IconButton';
import { InfoBanner } from '../InfoBanner';

enum TopBannerType {
  Restriction = 'Restriction',
  Info = 'Info',
}

export const TopBanner = ({
  className,
  infoBannerContent,
}: {
  className?: string;
  infoBannerContent?: React.ReactNode;
}) => {
  const [selectedBanner, setSelectedBanner] = useState(TopBannerType.Restriction);
  const { showComplianceBanner } = useComplianceState();
  const isSimpleUi = useSimpleUiEnabled();
  const showInfoBanner = infoBannerContent != null;

  const toggleSelectedBanner = () =>
    setSelectedBanner((prev) =>
      prev === TopBannerType.Restriction ? TopBannerType.Info : TopBannerType.Restriction
    );
  const toggleIconName =
    selectedBanner === TopBannerType.Restriction ? IconName.Info : IconName.Warning;

  const toggle = !(showComplianceBanner && showInfoBanner) ? undefined : isSimpleUi ? (
    <IconButton
      tw="text-color-text-2"
      type={ButtonType.Button}
      onClick={toggleSelectedBanner}
      iconName={toggleIconName}
      buttonStyle={ButtonStyle.WithoutBackground}
    />
  ) : (
    <$ToggleButton type="button" currentBanner={selectedBanner} onClick={toggleSelectedBanner}>
      <Icon iconName={toggleIconName} />
    </$ToggleButton>
  );

  const RestrictionBanner = isSimpleUi ? ComplianceBanner : $ComplianceBanner;
  const InfoBannerComponent = isSimpleUi ? InfoBanner : $InfoBanner;

  if (showComplianceBanner && (!showInfoBanner || selectedBanner === TopBannerType.Restriction)) {
    return <RestrictionBanner className={className} slotRight={toggle} />;
  }

  if (showInfoBanner) {
    return (
      <InfoBannerComponent className={className} slotRight={toggle}>
        {infoBannerContent}
      </InfoBannerComponent>
    );
  }

  return null;
};

const stickyTopBannerStyle = css`
  ${layoutMixins.sticky}
  --stickyArea-totalInsetTop: var(--page-currentHeaderHeight);
  height: var(--top-banner-currentHeight);
`;

const $ComplianceBanner = styled(ComplianceBanner)`
  ${stickyTopBannerStyle}
`;

const $InfoBanner = styled(InfoBanner)`
  ${stickyTopBannerStyle}
`;

const $ToggleButton = styled.button<{ currentBanner: TopBannerType }>`
  align-self: stretch;
  flex-shrink: 0;
  width: var(--top-banner-toggle-width);
  margin: -0.5rem -1rem -0.5rem 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-left: var(--border-width) solid var(--color-border);
  color: var(--color-text-1);

  ${({ currentBanner }) =>
    ({
      [TopBannerType.Restriction]: css`
        background-color: var(--color-layer-2);
        color: var(--color-accent);
      `,
      [TopBannerType.Info]: css`
        background-color: var(--color-gradient-error);
      `,
    })[currentBanner]}

  &:hover {
    background-color: var(--color-layer-3);
  }
`;
