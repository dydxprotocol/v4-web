import { useRef } from 'react';
import styled, { type AnyStyledComponent, keyframes, css } from 'styled-components';

import {
  Root,
  Trigger,
  Overlay,
  Content,
  Title,
  Description,
  Close,
  Portal,
} from '@radix-ui/react-dialog';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';

import { useDialogArea } from '@/hooks/useDialogArea';

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
};

export type DialogProps = ElementProps & StyleProps;

const DialogPortal = ({
  withPortal,
  container,
  children,
}: {
  withPortal: boolean;
  container?: HTMLElement;
  children: React.ReactNode;
}) => {
  const { dialogArea } = useDialogArea();

  return withPortal ? (
    <Portal container={container ?? dialogArea}>{children}</Portal>
  ) : (
    <>{children}</>
  );
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
  withClose = true,
  placement = DialogPlacement.Default,
  portalContainer,
  hasHeaderBorder = false,
  children,
  className,
}: DialogProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>();

  const showOverlay = ![DialogPlacement.Inline, DialogPlacement.FullScreen].includes(placement);

  return (
    <Root modal={showOverlay} open={isOpen} onOpenChange={setIsOpen}>
      {slotTrigger && <Trigger asChild>{slotTrigger}</Trigger>}
      <DialogPortal withPortal={placement !== DialogPlacement.Inline} container={portalContainer}>
        {showOverlay && <Styled.Overlay />}
        <Styled.Container
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
        >
          <Styled.Header $withBorder={hasHeaderBorder}>
            <Styled.HeaderTopRow>
              {onBack && <BackButton onClick={onBack} />}

              {slotIcon && <Styled.Icon>{slotIcon}</Styled.Icon>}

              {title && <Styled.Title>{title}</Styled.Title>}

              {!preventClose && withClose && (
                <Styled.Close ref={closeButtonRef}>
                  <Icon iconName={IconName.Close} />
                </Styled.Close>
              )}
            </Styled.HeaderTopRow>

            {description && <Styled.Description>{description}</Styled.Description>}

            {slotHeaderInner}
          </Styled.Header>

          <Styled.Content>{children}</Styled.Content>

          {slotFooter && <Styled.Footer>{slotFooter}</Styled.Footer>}
        </Styled.Container>
      </DialogPortal>
    </Root>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Overlay = styled(Overlay)`
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

Styled.Container = styled(Content)<{ placement: DialogPlacement }>`
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

  ${({ placement }) =>
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
      `,
      [DialogPlacement.Sidebar]: css`
        --dialog-width: var(--sidebar-width);

        @media ${breakpoints.notMobile} {
          max-width: var(--dialog-width);
          margin-left: auto;
        }

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
      `,
      [DialogPlacement.Inline]: css`
        @media (prefers-reduced-motion: no-preference) {
          &[data-state='open'] {
            animation: ${keyframes`
              from {
                scale: 0.99;
                opacity: 0;
                /* filter: blur(2px); */
                /* backdrop-filter: none; */
              }
            `} 0.15s var(--ease-out-expo);
          }

          &[data-state='closed'] {
            animation: ${keyframes`
              to {
                scale: 0.99;
                opacity: 0;
                /* filter: blur(2px); */
                /* backdrop-filter: none; */
              }
            `} 0.15s var(--ease-out-expo);
          }
        }
      `,
      [DialogPlacement.FullScreen]: css`
        --dialog-width: 100vw;
        --dialog-height: 100vh;
        top: 0;
        bottom: 0;
      `,
    }[placement])}
`;

Styled.Header = styled.header<{ $withBorder: boolean }>`
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

Styled.HeaderTopRow = styled.div`
  ${layoutMixins.row}
  gap: var(--dialog-title-gap);
`;

Styled.HeaderTopRow = styled.div`
  ${layoutMixins.row}
  gap: var(--dialog-title-gap);
`;

Styled.Content = styled.div`
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

Styled.Icon = styled.div`
  ${layoutMixins.row}

  width: 1em;
  height: 1em;

  font-size: var(--dialog-icon-size); /* 1 line-height */
  line-height: 1;
`;

Styled.Close = styled(Close)`
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

  @media ${breakpoints.tablet} {
    width: 1rem;
    height: 1rem;
    outline: none;
  }
`;

Styled.Title = styled(Title)`
  flex: 1;

  font: var(--font-large-medium);
  color: var(--color-text-2);

  overflow: hidden;
  text-overflow: ellipsis;
`;

Styled.Description = styled(Description)`
  margin-top: 0.5rem;
  color: var(--color-text-0);
  font: var(--font-base-book);
`;

Styled.Footer = styled.footer`
  display: grid;
  ${layoutMixins.stickyFooter}
  ${layoutMixins.withStickyFooterBackdrop}
  --stickyFooterBackdrop-outsetX: var(--dialog-paddingX);

  padding: var(--dialog-footer-paddingTop) var(--dialog-footer-paddingLeft)
    var(--dialog-footer-paddingBottom) var(--dialog-footer-paddingRight);
`;
