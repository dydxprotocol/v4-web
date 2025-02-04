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
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { useDialogArea } from '@/hooks/useDialogArea';
import { useResizeObserver } from '@/hooks/useResizeObserver';

import breakpoints from '@/styles/breakpoints';
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
  preventCloseOnOverlayClick?: boolean;
  slotTrigger?: React.ReactNode;
  slotHeaderAbove?: React.ReactNode;
  slotHeader?: React.ReactNode;
  slotHeaderInner?: React.ReactNode;
  slotFooter?: React.ReactNode;
  withClose?: boolean;
};

type StyleProps = {
  placement?: DialogPlacement;
  portalContainer?: HTMLElement;
  hasHeaderBorder?: boolean;
  hasHeaderBlur?: boolean;
  hasFooterBorder?: boolean;
  children?: React.ReactNode;
  className?: string;
  stacked?: boolean;
  withAnimation?: boolean;
  withOverlay?: boolean;
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
  preventCloseOnOverlayClick,
  slotTrigger,
  slotHeaderAbove,
  slotHeader,
  slotHeaderInner,
  slotFooter,
  stacked,
  withClose = true,
  placement = DialogPlacement.Default,
  portalContainer,
  hasHeaderBorder = false,
  hasHeaderBlur = true,
  hasFooterBorder = false,
  withAnimation = false,
  withOverlay = ![DialogPlacement.Inline, DialogPlacement.FullScreen].includes(placement),
  children,
  className,
}: DialogProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { height = 0 } = useResizeObserver({
    ref,
    box: 'border-box',
  });

  return (
    <Root modal={withOverlay} open={isOpen} onOpenChange={setIsOpen}>
      {slotTrigger && <Trigger asChild>{slotTrigger}</Trigger>}
      <DialogPortal withPortal={placement !== DialogPlacement.Inline} container={portalContainer}>
        {withOverlay && <$Overlay />}
        <$Container
          placement={placement}
          className={className}
          onEscapeKeyDown={() => {
            closeButtonRef.current?.focus();
          }}
          onInteractOutside={(e: Event) => {
            if (!withOverlay || !!preventClose || !!preventCloseOnOverlayClick) {
              e.preventDefault();
            }
          }}
          $height={height}
          $stacked={stacked}
          $withAnimation={withAnimation}
        >
          <$InnerContainer ref={ref} placement={placement}>
            {slotHeaderAbove}
            {stacked ? (
              <$StackedHeaderTopRow $withBorder={hasHeaderBorder} $withBlur={hasHeaderBlur}>
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
            ) : slotHeader ? (
              <div>
                {!preventClose && withClose && (
                  <$Close ref={closeButtonRef} $absolute>
                    <Icon iconName={IconName.Close} />
                  </$Close>
                )}
                {slotHeader}
              </div>
            ) : (
              <$Header $withBorder={hasHeaderBorder} $withBlur={hasHeaderBlur}>
                <div tw="row gap-[--dialog-title-gap]">
                  {onBack && <BackButton onClick={onBack} />}

                  {slotIcon && (
                    <div tw="row h-[1em] w-[1em] text-[length:--dialog-icon-size] leading-none">
                      {slotIcon}
                    </div>
                  )}

                  {title && <$Title>{title}</$Title>}

                  {!preventClose && withClose && (
                    <$Close ref={closeButtonRef}>
                      <Icon iconName={IconName.Close} />
                    </$Close>
                  )}
                </div>

                {description && <$Description>{description}</$Description>}

                {slotHeaderInner}
              </$Header>
            )}

            <$Content>{children}</$Content>

            {slotFooter && <$Footer $withBorder={hasFooterBorder}>{slotFooter}</$Footer>}
          </$InnerContainer>
        </$Container>
      </DialogPortal>
    </Root>
  );
};
const $Overlay = styled(Overlay)`
  z-index: 1;

  position: fixed;
  inset: 0;

  pointer-events: none !important;

  -webkit-backdrop-filter: brightness(var(--overlay-filter));
  backdrop-filter: brightness(var(--overlay-filter));
`;

const $Container = styled(Content)<{
  placement: DialogPlacement;
  $height?: number;
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
  pointer-events: auto !important;

  inset: 0;
  width: 100%;
  height: 100%;

  ${layoutMixins.stickyArea0}
  --stickyArea0-topHeight: var(--dialog-header-height);
  --stickyArea0-background: var(--dialog-backgroundColor);

  ${layoutMixins.flexColumn}

  outline: none;

  ${({ placement, $height, $withAnimation }) =>
    ({
      [DialogPlacement.Default]: css`
        inset: var(--dialog-inset);
        margin: auto;

        max-width: var(--dialog-width);
        max-height: var(--dialog-height);

        ${$withAnimation
          ? css`
              height: ${$height ? `${$height}px` : 'fit-content'};
              transition: height 0.25s ease-in-out;
            `
          : css`
              height: fit-content;
            `}

        display: flex;
        flex-direction: column;

        border-radius: var(--dialog-radius);

        @media ${breakpoints.mobile} {
          top: calc(var(--dialog-inset) * 2);
          bottom: 0;
          --dialog-width: initial;
          width: var(--dialog-width);

          margin-bottom: 0;

          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
      `,
      [DialogPlacement.Sidebar]: css`
        --dialog-width: var(--sidebar-width);
        height: 100%;

        @media ${breakpoints.notMobile} {
          max-width: var(--dialog-width);
          margin-left: auto;
        }
      `,
      [DialogPlacement.Inline]: css``,
      [DialogPlacement.FullScreen]: css`
        --dialog-width: 100vw;
        --dialog-height: 100vh;
        top: 0;
        bottom: 0;
      `,
    })[placement]}

  ${({ $stacked }) =>
    $stacked &&
    css`
      justify-content: center;
      text-align: center;
    `}
`;

const $InnerContainer = styled.div<{ placement: DialogPlacement }>`
  ${({ placement }) =>
    ({
      [DialogPlacement.Default]: css``,
      [DialogPlacement.Sidebar]: css`
        ${layoutMixins.flexColumn}
        height: 100%;
      `,
      [DialogPlacement.Inline]: css`
        ${layoutMixins.flexColumn}
        height: 100%;
      `,
      [DialogPlacement.FullScreen]: css`
        ${layoutMixins.flexColumn}
        height: 100%;
      `,
    })[placement]}
`;

const $Header = styled.header<{ $withBorder: boolean; $withBlur: boolean }>`
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

  ${({ $withBlur }) =>
    !$withBlur &&
    css`
      --stickyArea-backdropFilter: none;
    `};
`;

const $StackedHeaderTopRow = styled.div<{ $withBorder: boolean; $withBlur: boolean }>`
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

  ${({ $withBlur }) =>
    !$withBlur &&
    css`
      --stickyArea-backdropFilter: none;
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
  z-index: 1;

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

const $Title = tw(Title)`flex-1 font-large-medium text-color-text-2 overflow-hidden text-ellipsis`;

const $Description = tw(Description)`mt-0.5 text-color-text-0 font-base-book`;

const $Footer = styled.footer<{ $withBorder: boolean }>`
  display: grid;
  ${layoutMixins.stickyFooter}

  ${({ $withBorder }) =>
    $withBorder &&
    css`
      ${layoutMixins.withOuterBorder};
      background: var(--dialog-backgroundColor);
      --dialog-footer-paddingTop: var(--dialog-footer-paddingBottom);
    `};

  padding: var(--dialog-footer-paddingTop) var(--dialog-footer-paddingLeft)
    var(--dialog-footer-paddingBottom) var(--dialog-footer-paddingRight);
`;
