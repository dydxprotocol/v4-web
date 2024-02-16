import { css, keyframes } from 'styled-components';

import { layoutMixins } from './layoutMixins';

export const popoverMixins = {
  triggerWithGrid: css`
    display: grid;
    overflow: hidden;
    border: 1px solid var(--color-layer-6);
  `,
  trigger: css`
    --trigger-padding: 0.5em 1em;
    --trigger-radius: 0.5em;
    --trigger-border: none;

    --trigger-height: ;

    --trigger-backgroundColor: var(--color-layer-2);
    --trigger-textColor: var(--color-text-0);

    --trigger-open-backgroundColor: var(--color-layer-1);
    --trigger-open-textColor: var(--color-text-2);

    --trigger-active-filter: brightness(var(--active-filter));
    --trigger-hover-filter: brightness(var(--hover-filter-base));

    display: flex;
    align-items: center;
    gap: 0.5em;
    height: var(--trigger-height);

    padding: var(--trigger-padding);
    border-radius: var(--trigger-radius);
    border: var(--trigger-border);

    background-color: var(--trigger-backgroundColor);
    color: var(--trigger-textColor);

    cursor: pointer;

    &:hover:not(:disabled) {
      filter: var(--trigger-hover-filter);
    }

    &:active:not(:disabled) {
      filter: var(--trigger-active-filter);
    }

    &[data-state='open'] {
      background-color: var(--trigger-open-backgroundColor);
      color: var(--trigger-open-textColor);
    }
  `,

  searchSelectTrigger: css`
    --trigger-backgroundColor: var(--color-layer-4);
    --trigger-textColor: var(--color-text-0);

    --trigger-open-backgroundColor: var(--color-layer-4);
    --trigger-open-textColor: var(--color-text-2);

    ${layoutMixins.spacedRow}
    grid-template-columns: 1fr auto;
    gap: 0;
    border: 1px solid var(--color-layer-6);
  `,

  marketDropdownTrigger: css`
    --trigger-radius: 0;
    --trigger-open-backgroundColor: var(--color-layer-2);

    display: grid;
    overflow: hidden;
  `,

  popover: css`
    --border-width: var(--default-border-width);
    --border-color: var(--color-border);

    --popover-padding: 0;
    --popover-margin: 0;
    --popover-width: auto;
    --popover-radius: 0.5em;
    --popover-backgroundColor: var(--color-layer-3);
    --popover-textColor: ;
    --popover-shadow-color: var(--color-border);
    --popover-shadow-size: 0;
    --popover-backdrop-filter: saturate(120%) blur(6px);
    --popover-origin: var(--radix-popper-transform-origin);
    --popover-border: none;

    z-index: 1;

    color: var(--popover-textColor, inherit);

    padding: var(--popover-padding);
    margin: var(--popover-margin);
    width: var(--popover-width);
    overflow: hidden;
    backdrop-filter: var(--popover-backdrop-filter);
    background-color: var(--popover-backgroundColor);
    /* clip-path: inset(0 round calc(var(--popover-radius))); */
    border-radius: var(--popover-radius);
    box-shadow: 0 0 0 var(--popover-shadow-size) var(--popover-shadow-color);
    border: var(--popover-border);

    transform-origin: var(--popover-origin);
  `,

  popoverAnimation: css`
    --popover-animation-duration: 0.2s;
    --popover-closed-height: 0;

    transform-origin: var(--popover-origin);

    @media (prefers-reduced-motion: no-preference) {
      &[data-state='open'],
      &[data-state='instant-open'], /* Tooltip */
      &[data-state='delayed-open'] /* Tooltip */ {
        animation: ${keyframes`
          from {
            opacity: 0;
            filter: blur(2px);
            backdrop-filter: none;
            box-shadow: 0 0 0 transparent;
          }
          /* Don't interfere with Floating UI positioning */
          0.01% {
            max-height: var(--popover-closed-height);
            scale: 0.9;
          }
        `} var(--popover-animation-duration) var(--ease-out-expo);
      }

      &[data-state='closed'] {
        animation: ${keyframes`
          to {
            opacity: 0;
            filter: blur(2px);
            backdrop-filter: none;
            box-shadow: 0 0 0 transparent;

            max-height: var(--popover-closed-height);
            scale: 0.9;
          }
        `} var(--popover-animation-duration);

        pointer-events: none;
      }
    }
  `,

  // Use with container mixin to position popover overlay within a stacking context
  backdropOverlay: css`
    --popover-overlay-blur-duration: 0.2s;

    &:after {
      content: '';
      position: fixed;
      inset: 0;

      /* position: absolute;
      inset: -100vh -100vw; */

      z-index: -2;
      pointer-events: none;

      &:hover {
        will-change: backdrop-filter;
      }

      @media (prefers-reduced-motion: no-preference) {
        transition: backdrop-filter var(--popover-overlay-blur-duration);
      }
    }

    &[data-state='open']:after {
      backdrop-filter: blur(6px);
    }
  `,

  item: css`
    --item-font-size: inherit;

    --item-checked-backgroundColor: var(--color-layer-2);
    --item-checked-textColor: currentColor;

    --item-highlighted-backgroundColor: var(--color-layer-2);
    --item-highlighted-textColor: var(--color-text-2);

    --item-gap: 0.5em;
    --item-radius: 0px;
    --item-padding: 0.5em 1em;

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--item-gap);

    padding: var(--item-padding);
    border-radius: var(--item-radius);

    font-size: var(--item-font-size);

    transition: 0.1s;

    cursor: pointer;

    &[data-disabled] {
      opacity: 0.25;
      cursor: not-allowed;
    }

    &:not([data-disabled]) {
      /* &:hover, */
      /* :not(:has(* > [data-highlighted])) > &:hover, */
      &[data-radix-collection-item]:hover, // @radix-ui/react-navigation-menu
      /* &:focus-visible, */
      &[aria-selected="true"], // cmdk
      &[data-highlighted] // @radix-ui
      {
        filter: brightness(var(--hover-filter-base));
        background-color: var(--item-highlighted-backgroundColor);
        color: var(--item-highlighted-textColor, var(--trigger-textColor, inherit)) !important;
        outline: none;
      }
    }

    &[data-state='checked'], // @radix-ui
    &[aria-current='page'] // <a>
    {
      background-color: var(
        --item-checked-backgroundColor,
        var(--trigger-selected-color, var(--popover-backgroundColor, inherit))
      );
      color: var(--item-checked-textColor, var(--trigger-textColor, inherit));
    }
  `,
};
