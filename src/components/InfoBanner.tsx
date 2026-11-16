import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';

import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import breakpoints from '@/styles/breakpoints';

import { Icon, IconName } from './Icon';
import { SimpleUiBannerAlert } from './TopBanner/SimpleUiBannerAlert';

type InfoBannerProps = {
  className?: string;
  children: React.ReactNode;
  slotRight?: React.ReactNode;
};

export const InfoBanner = ({ className, children, slotRight }: InfoBannerProps) => {
  const isSimpleUi = useSimpleUiEnabled();

  const content = (
    <div tw="flex min-w-0 flex-1 items-center gap-0.5">
      <Icon iconName={IconName.Info} tw="shrink-0 text-color-accent" />
      <span>{children}</span>
    </div>
  );

  if (isSimpleUi) {
    return (
      <SimpleUiBannerAlert className={className} type={AlertType.Notice}>
        {content}
        {slotRight}
      </SimpleUiBannerAlert>
    );
  }

  return (
    <$InfoBanner className={className}>
      {content}
      {slotRight}
    </$InfoBanner>
  );
};

const $InfoBanner = styled.div`
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
  border-left: 4px solid var(--color-accent);
  background-color: var(--color-layer-2);
  color: var(--color-text-1);

  @media ${breakpoints.tablet} {
    position: relative;
  }
`;
