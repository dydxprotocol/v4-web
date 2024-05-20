import { PropsWithChildren, useRef } from 'react';

import {
  Close,
  Content,
  Description,
  DialogCloseProps,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from '@radix-ui/react-dialog';
import styled, { css, keyframes } from 'styled-components';

import { useDialogArea } from '@/hooks/useDialogArea';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { Icon, IconName } from '@/components/Icon';

export enum DialogPlacement {
  Default = 'Default',
  Sidebar = 'Sidebar',
  Inline = 'Inline',
  FullScreen = 'FullScreen',
}

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  slotIcon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onBack?: () => void;
  preventClose?: boolean;
  slotTrigger?: React.ReactNode;
  slotHeaderInner?: React.ReactNode;
  slotFooter?: React.ReactNode;
  withClose?: boolean;
};

type StyleProps = {
  placement?: DialogPlacement;
  portalContainer?: HTMLElement;
  hasHeaderBorder?: boolean;
  children?: React.ReactNode;
  className?: string;
  stacked?: boolean;
  withAnimation?: boolean;
};

export type DialogProps = ElementProps & StyleProps;

const DialogPortal = ({
  withPortal,
  container,
  children,
}: PropsWithChildren<{
  withPortal: boolean;
  container?: HTMLElement;
}>) => {
  const {
    dialogAreaRef: { current },
  } = useDialogArea() ?? { dialogAreaRef: {} };
  return withPortal ? <Portal container={container ?? current}>{children}</Portal> : children;
};

export const Dialog = ({
  isOpen = false,
  setIsOpen,
  slotIcon,
  title,
  description,
  onBack,
  preventClose,
  slotTrigger,
  slotHeaderInner,
  slotFooter,
  stacked,
  withClose = true,
  placement = DialogPlacement.Default,
  portalContainer,
  hasHeaderBorder = false,
  withAnimation = false,
  children,
  className,
}: DialogProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const showOverlay = ![DialogPlacement.Inline, DialogPlacement.FullScreen].includes(placement);

  return (
    <Root modal={showOverlay} open={isOpen} onOpenChange={setIsOpen}>
      {slotTrigger && <Trigger asChild>{slotTrigger}</Trigger>}
      <DialogPortal withPortal={placement !== DialogPlacement.Inline} container={portalContainer}>
        {showOverlay && <$Overlay />}
        <$Container
          placement={placement}
          className={className}
          onEscapeKeyDown={() => {
            closeButtonRef.current?.focus();
          }}
          onInteractOutside={(e: Event) => {
            if (!showOverlay || preventClose) {
              e.preventDefault();
            }
          }}
          $stacked={stacked}
          $withAnimation={withAnimation}
        >
          {stacked ? (
            <$StackedHeaderTopRow $withBorder={hasHeaderBorder}>
              {onBack && <$BackButton onClick={onBack} />}

              {slotIcon}

              {!preventClose && withClose && (
                <$Close ref={closeButtonRef} $absolute={stacked}>
                  <Icon iconName={IconName.Close} />
                </$Close>
              )}

              {title && <$Title>{title}</$Title>}

              {description && <$Description>{description}</$Description>}

              {slotHeaderInner}
            </$StackedHeaderTopRow>
          ) : (
            <$Header $withBorder={hasHeaderBorder}>
              <$HeaderTopRow>
                {onBack && <BackButton onClick={onBack} />}

                {slotIcon && <$Icon>{slotIcon}</$Icon>}

                {title && <$Title>{title}</$Title>}

                {!preventClose && withClose && (
                  <$Close ref={closeButtonRef}>
                    <Icon iconName={IconName.Close} />
                  </$Close>
                )}
              </$HeaderTopRow>

              {description && <$Description>{description}</$Description>}

              {slotHeaderInner}
            </$Header>
          )}

          <$Content>{children}</$Content>

          {slotFooter && <$Footer>{slotFooter}</$Footer>}
        </$Container>
      </DialogPortal>
    </Root>
  );
};
const $Overlay = styled(Overlay)`
  z-index: 1;

  position: fixed;
  inset: 0;

  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    backdrop-filter: blur(8px);
  }

  @media (prefers-reduced-motion: no-preference) {
    &[data-state='open'] {
      animation: ${keyframes`
        to {
          backdrop-filter: blur(8px);
        }
      `} 0.15s var(--ease-out-expo) forwards;
    }

    &[data-state='closed'] {
      animation: ${keyframes`
        from {
          backdrop-filter: blur(8px);
        }
      `} 0.15s;
    }
  }
`;

const $Container = styled(Content)<{
  placement: DialogPlacement;
  $stacked?: boolean;
  $withAnimation?: boolean;
}>`
  /* Params */
  --dialog-inset: 1rem;
  --dialog-width: 30rem;
  --dialog-backgroundColor: var(--color-layer-3);
  --dialog-radius: 1rem;

  --dialog-paddingX: 1.5rem;

  --dialog-header-z: 1;
  --dialog-header-height: auto; /* set to fixed value to enable inner sticky areas */
  --dialog-header-paddingTop: 1.5rem;
  --dialog-header-paddingBottom: 1rem;
  --dialog-header-paddingLeft: var(--dialog-paddingX);
  --dialog-header-paddingRight: var(--dialog-paddingX);

  --dialog-content-paddingTop: 0rem;
  --dialog-content-paddingBottom: 1.5rem;
  --dialog-content-paddingLeft: var(--dialog-paddingX);
  --dialog-content-paddingRight: var(--dialog-paddingX);

  --dialog-footer-paddingTop: 0rem;
  --dialog-footer-paddingBottom: 1rem;
  --dialog-footer-paddingLeft: var(--dialog-paddingX);
  --dialog-footer-paddingRight: var(--dialog-paddingX);

  --dialog-title-gap: 0.5rem;
  --dialog-icon-size: 1.75em;

  /* Calculated */
  --dialog-height: calc(100% - 2 * var(--dialog-inset));

  /* Rules */
  ${layoutMixins.scrollArea}
  --scrollArea-height: var(--dialog-height);

  ${layoutMixins.withOuterBorder}
  --border-width: var(--default-border-width);
  --border-color: var(--color-border);

  isolation: isolate;
  z-index: 1;
  position: absolute;

  inset: 0;
  width: 100%;
  height: 100%;

  ${layoutMixins.stickyArea0}
  --stickyArea0-topHeight: var(--dialog-header-height);
  --stickyArea0-background: var(--dialog-backgroundColor);

  ${layoutMixins.flexColumn}

  outline: none;

  ${({ placement, $withAnimation }) =>
    ({
      [DialogPlacement.Default]: css`
        inset: var(--dialog-inset);
        margin: auto;

        max-width: var(--dialog-width);
        height: fit-content;
        max-height: var(--dialog-height);

        display: flex;
        flex-direction: column;

        border-radius: var(--dialog-radius);
        /* clip-path: inset(
          calc(-1 * var(--border-width)) round calc(var(--dialog-radius) + var(--border-width))
        );
        overflow-clip-margin: var(--border-width); */

        @media ${breakpoints.mobile} {
          top: calc(var(--dialog-inset) * 2);
          bottom: 0;
          --dialog-width: initial;
          width: var(--dialog-width);

          margin-bottom: 0;

          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;

          /* Hack (uneven border-radius causes overflow issues) */
          /* top: auto;
          bottom: calc(-1 * var(--dialog-radius));
          padding-bottom: var(--dialog-radius); */
        }

        ${$withAnimation &&
        css`
          @media (prefers-reduced-motion: no-preference) {
            &[data-state='open'] {
              animation: ${keyframes`
              from {
                opacity: 0;
              }
              0.01% {
                max-height: 0;
              }
            `} 0.15s var(--ease-out-expo);
            }

            &[data-state='closed'] {
              animation: ${keyframes`
              to {
                opacity: 0;
                scale: 0.9;
                max-height: 0;
              }
            `} 0.15s;
            }
          }
        `}
      `,
      [DialogPlacement.Sidebar]: css`
        --dialog-width: var(--sidebar-width);

        @media ${breakpoints.notMobile} {
          max-width: var(--dialog-width);
          margin-left: auto;
        }

        ${$withAnimation &&
        css`
          @media (prefers-reduced-motion: no-preference) {
            &[data-state='open'] {
              animation: ${keyframes`
              from {
                translate: 100% 0;
                opacity: 0;
              }
            `} 0.15s var(--ease-out-expo);
            }

            &[data-state='closed'] {
              animation: ${keyframes`
              to {
                translate: 100% 0;
                opacity: 0;
              }
            `} 0.15s var(--ease-out-expo);
            }
          }
        `}
      `,
      [DialogPlacement.Inline]: css`
        ${$withAnimation &&
        css`
          @media (prefers-reduced-motion: no-preference) {
            &[data-state='open'] {
              animation: ${keyframes`
              from {
                scale: 0.99;
                opacity: 0;
              }
            `} 0.15s var(--ease-out-expo);
            }

            &[data-state='closed'] {
              animation: ${keyframes`
              to {
                scale: 0.99;
                opacity: 0;
              }
            `} 0.15s var(--ease-out-expo);
            }
          }
        `}
      `,
      [DialogPlacement.FullScreen]: css`
        --dialog-width: 100vw;
        --dialog-height: 100vh;
        top: 0;
        bottom: 0;
      `,
    }[placement])}

  ${({ $stacked }) =>
    $stacked &&
    css`
      justify-content: center;
      text-align: center;
    `}
`;

const $Header = styled.header<{ $withBorder: boolean }>`
  ${layoutMixins.stickyHeader}

  z-index: var(--dialog-header-z);

  display: block;
  padding: var(--dialog-header-paddingTop) var(--dialog-header-paddingLeft)
    var(--dialog-header-paddingBottom) var(--dialog-header-paddingRight);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;

  ${({ $withBorder }) =>
    $withBorder &&
    css`
      ${layoutMixins.withOuterBorder};
      background: var(--dialog-backgroundColor);
    `};
`;

const $HeaderTopRow = styled.div`
  ${layoutMixins.row}
  gap: var(--dialog-title-gap);
`;

const $StackedHeaderTopRow = styled.div<{ $withBorder: boolean }>`
  ${layoutMixins.flexColumn}
  align-items: center;
  justify-content: center;
  padding: var(--dialog-header-paddingTop) var(--dialog-header-paddingLeft)
    var(--dialog-header-paddingBottom) var(--dialog-header-paddingRight);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;

  ${({ $withBorder }) =>
    $withBorder &&
    css`
      ${layoutMixins.withOuterBorder};
      background: var(--dialog-backgroundColor);
    `};
`;

const $Content = styled.div`
  flex: 1;

  ${layoutMixins.column}

  ${layoutMixins.stickyArea1}
  --stickyArea1-background: var(--dialog-backgroundColor);
  --stickyArea1-paddingTop: var(--dialog-content-paddingTop);
  --stickyArea1-paddingBottom: var(--dialog-content-paddingBottom);
  --stickyArea1-paddingLeft: var(--dialog-content-paddingLeft);
  --stickyArea1-paddingRight: var(--dialog-content-paddingRight);

  padding: var(--dialog-content-paddingTop) var(--dialog-content-paddingRight)
    var(--dialog-content-paddingBottom) var(--dialog-content-paddingLeft);

  isolation: isolate;
`;

const $Icon = styled.div`
  ${layoutMixins.row}

  width: 1em;
  height: 1em;

  font-size: var(--dialog-icon-size); /* 1 line-height */
  line-height: 1;
`;

const $Close = styled(Close)<{ $absolute?: boolean }>`
  width: 0.7813rem;
  height: 0.7813rem;

  box-sizing: content-box;
  padding: 0.5rem;
  margin: auto 0;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 0.25rem;

  color: var(--color-text-0);

  > svg {
    height: 100%;
    width: 100%;
  }

  &:hover,
  &:focus-visible {
    color: var(--color-text-2);
  }

  ${({ $absolute }) =>
    $absolute &&
    css`
      position: absolute;
      right: var(--dialog-header-paddingRight);
      top: var(--dialog-header-paddingTop);
    `}

  @media ${breakpoints.tablet} {
    width: 1rem;
    height: 1rem;
    outline: none;
  }
` as React.ForwardRefExoticComponent<
  { $absolute?: boolean } & DialogCloseProps & React.RefAttributes<HTMLButtonElement>
>;

const $BackButton = styled(BackButton)`
  position: absolute;
  left: var(--dialog-header-paddingLeft);
  top: var(--dialog-header-paddingTop);
`;

const $Title = styled(Title)`
  flex: 1;

  font: var(--font-large-medium);
  color: var(--color-text-2);

  overflow: hidden;
  text-overflow: ellipsis;
`;

const $Description = styled(Description)`
  margin-top: 0.5rem;
  color: var(--color-text-0);
  font: var(--font-base-book);
`;

const $Footer = styled.footer`
  display: grid;
  ${layoutMixins.stickyFooter}
  ${layoutMixins.withStickyFooterBackdrop}
  --stickyFooterBackdrop-outsetX: var(--dialog-paddingX);

  padding: var(--dialog-footer-paddingTop) var(--dialog-footer-paddingLeft)
    var(--dialog-footer-paddingBottom) var(--dialog-footer-paddingRight);
`;
