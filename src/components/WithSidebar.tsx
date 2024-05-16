import React from 'react';

import { useDispatch, useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { ToggleButton } from '@/components/ToggleButton';

import { setIsSidebarOpen } from '@/state/layout';
import { getIsSidebarOpen } from '@/state/layoutSelectors';

type ElementProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
};

export type WithSidebarProps = ElementProps;

export const WithSidebar: React.FC<WithSidebarProps> = ({ children, sidebar }) => {
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector(getIsSidebarOpen);
  const stringGetter = useStringGetter();

  return (
    <$Container data-state={!sidebar ? 'none' : isSidebarOpen ? 'open' : 'closed'}>
      {sidebar && (
        <$Side>
          <$TriggerButton
            shape={ButtonShape.Pill}
            size={isSidebarOpen ? ButtonSize.XSmall : ButtonSize.Base}
            isPressed={!isSidebarOpen}
            onPressedChange={(isPressed: boolean) => dispatch(setIsSidebarOpen(!isPressed))}
          >
            {isSidebarOpen ? (
              stringGetter({ key: STRING_KEYS.HIDE })
            ) : (
              <Icon iconName={IconName.Menu} />
            )}
          </$TriggerButton>

          <$Sidebar data-state={isSidebarOpen ? 'open' : 'closed'}>{sidebar}</$Sidebar>
        </$Side>
      )}

      <$Content>{children}</$Content>
    </$Container>
  );
};
const $Container = styled.div`
  /* Params */
  --withSidebar-containerWidth: 100vw;
  --withSidebar-open-sidebarWidth: var(--sidebar-width);
  --withSidebar-closed-sidebarWidth: var(--collapsed-sidebar-width);
  --withSidebar-gap: var(--border-width);

  /* Computed */

  --withSidebar-current-sidebarWidth: 0px;
  --withSidebar-current-contentAreaWidth: calc(
    var(--withSidebar-containerWidth) - var(--withSidebar-gap) -
      var(--withSidebar-current-sideAreaWidth)
  );

  &[data-state='none'] {
    --withSidebar-open-sideAreaWidth: 0px;
    --withSidebar-closed-sideAreaWidth: 0px;
  }
  &[data-state='open'] {
    --withSidebar-current-sidebarWidth: var(--withSidebar-open-sidebarWidth);
  }
  &[data-state='closed'] {
    --withSidebar-current-sidebarWidth: var(--withSidebar-closed-sidebarWidth);
  }

  @media ${breakpoints.notTablet} {
    /* Dynamic sidebarArea, open sidebar shrinks contentArea */
    --withSidebar-current-sideAreaWidth: var(--withSidebar-current-sidebarWidth);
    /* prettier-ignore */
    --withSidebar-gridTemplate:
      'Side Content' 100%
      / auto 1fr;
  }

  @media ${breakpoints.tablet} {
    /* No sidebar */
    --withSidebar-current-sideAreaWidth: 0px;
    /* prettier-ignore */
    --withSidebar-gridTemplate:
      'Content' 100%
      / 1fr;
  }

  /* Rules */

  ${layoutMixins.stickyArea1}
  --stickyArea1-leftWidth: var(--withSidebar-current-sideAreaWidth);
  --stickyArea1-leftGap: var(--border-width);
  min-height: var(--stickyArea-height);

  display: grid;
  grid-template: var(--withSidebar-gridTemplate);
`;

const $Side = styled.aside`
  grid-area: Side;

  ${layoutMixins.container}

  ${layoutMixins.sticky}
  max-height: var(--stickyArea-height);
  backdrop-filter: none;
  background-color: var(--color-layer-2);

  ${layoutMixins.stack}
`;

const $Sidebar = styled.div`
  --current-sidebar-width: var(--sidebar-width);

  ${layoutMixins.scrollArea}

  width: min(var(--withSidebar-current-sidebarWidth), var(--withSidebar-containerWidth));
  transition: var(--ease-out-expo) 0.3s;
  transform: perspective(62.5em);
  transform-origin: left top;

  &[data-state='closed'] {
    --current-sidebar-width: var(--collapsed-sidebar-width);
    opacity: 0;
    pointer-events: none;
    transform: perspective(62.5em) translateZ(-12.5em);
  }

  ${layoutMixins.sticky}

  &:hover {
    will-change: width;
  }
`;

const $TriggerButton = styled(ToggleButton)`
  --button-toggle-on-backgroundColor: transparent;

  place-self: start end;
  z-index: 2;

  min-width: 0;
  min-height: 0;

  &[data-state='off'] {
    margin: 0.75rem;

    @media (prefers-reduced-motion: no-preference) {
      animation: ${keyframes`
        10%, 40% {
          opacity: 0;
          scale: 0;
        }
      `} 0.2s;
    }
  }

  &[data-state='on'] {
    --button-border: none;
    --button-radius: 0;

    min-width: 100%;
    min-height: 100%;

    outline-color: transparent;

    @media (prefers-reduced-motion: no-preference) {
      transition: var(--ease-out-expo) 0.25s;

      animation: ${keyframes`
        20% {
          opacity: 0;
          scale: 0;
        }
      `} 0.2s;
    }
  }
`;

const $Content = styled.article`
  grid-area: Content;

  ${layoutMixins.contentContainerPage}
  --content-container-width: var(--withSidebar-current-contentAreaWidth);

  ${layoutMixins.stickyArea2}

  transition: var(--ease-out-expo) 0.25s;
`;
