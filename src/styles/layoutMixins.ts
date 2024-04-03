import {
  css,
  keyframes,
  type FlattenInterpolation,
  type FlattenSimpleInterpolation,
  type ThemeProps,
} from 'styled-components';

export const layoutMixins: Record<
  string,
  FlattenSimpleInterpolation | FlattenInterpolation<ThemeProps<any>>
> = {
  // A standalone row
  row: css`
    display: flex;
    flex-direction: row;
    align-items: center;
  `,

  spacedRow: css`
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    justify-content: space-between;
  `,

  // Use within a block/inline layout
  inlineRow: css`
    display: inline-flex;
    align-items: center;
    gap: 0.5ch;
    min-width: max-content;
  `,

  // A standalone column (shrinks to fit container)
  column: css`
    display: grid;
    grid-auto-flow: row;
    grid-template-columns: minmax(0, 1fr);
  `,

  // A standalone column (shrinks to fit container)
  flexColumn: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,

  // A column as a child of a row
  rowColumn: css`
    display: grid;
    grid-auto-flow: row;
    min-width: max-content;
  `,

  flexWrap: css`
    display: flex;
    flex-wrap: wrap;
  `,

  // A column with a fixed header and expanding content
  expandingColumnWithHeader: css`
    // Expand if within a flexColumn
    flex: 1;

    display: grid;
    /* prettier-ignore */
    grid-template:
      auto
      minmax(0, 1fr)
      / minmax(0, 1fr);
  `,

  // A column with a fixed footer and expanding content
  expandingColumnWithFooter: css`
    // Expand if within a flexColumn
    flex: 1;

    display: grid;
    /* prettier-ignore */
    grid-template:
      minmax(0, 1fr)
      auto
      / minmax(0, 1fr);
  `,

  gridEqualColumns: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  `,

  gridConstrainedColumns: css`
    // Params

    --grid-max-columns: 2;
    --column-gap: var(--border-width);
    --column-min-width: 20rem;
    --column-max-width: 25rem;
    --single-column-max-width: 22.5rem;

    // Computed

    --grid-max-width: calc(
      var(--grid-max-columns) * var(--column-max-width) + (var(--grid-max-columns) - 1) *
        var(--column-gap)
    );
    --column-width: calc(
      (100% - ((var(--grid-max-columns) - 1) * var(--column-gap))) / var(--grid-max-columns)
    );

    // Rules
    max-width: var(--grid-max-width);

    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(
        clamp(min(100%, var(--column-min-width)), var(--column-width), var(--column-max-width)),
        clamp(
          var(--column-min-width),
          ((var(--column-min-width) * 2 + var(--column-gap)) - 100%) * 100000000000,
          /* Width is smaller than 2 grid columns */ var(--single-column-max-width)
        )
      )
    );
    column-gap: var(--column-gap);
  `,

  flexEqualColumns: css`
    display: flex;

    > * {
      flex: 1;
    }
  `,

  flexEqualRow: css`
    display: flex;
    gap: 0.5rem;

    > * {
      flex: 1;
    }
  `,

  stack: css`
    display: grid;
    grid-template-areas: 'stack';

    > *,
    &:before,
    &:after {
      grid-area: stack;
    }
  `,

  // A Container is an elevated stacking context with an inner pseudo-background for inner popover overlays to appear behind.
  container: css`
    /* Stacking context */
    isolation: isolate;
    z-index: 1;
    position: relative;

    /*
      Inner layers:
      - Pseudo background with border (z = -1)
      - Popover overlays (z = -2)
    */
    &:before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 0;

      background: inherit;
      ${() => layoutMixins.withOuterBorder}
      pointer-events: none;
    }

    /* Popover blur: detect state with :has() */
    /*
    --popover-overlay-blur-duration: 0.2s;
    &:after {
      content: '';

      position: absolute;
      inset: 0;

      z-index: -2;
      pointer-events: none;

      &:hover {
        will-change: backdrop-filter;
      }

      @media (prefers-reduced-motion: no-preference) {
        transition: var(--popover-overlay-blur-duration);
      }
    }

    &:has([data-state='open']):after {
      backdrop-filter: blur(4px) contrast(1.01);
      inset: -100vmax;
    } */

    /* Popover blur: detect state with :has(), blur next siblings */
    /*
    --popover-overlay-blur-duration: 0.2s;
    ~ * {
      transition: var(--popover-overlay-blur-duration);
    }
    &:has([data-state='open']) ~ * {
      filter: blur(4px) contrast(1.01);
    } */
  `,

  // A content container column
  contentContainer: css`
    /* Params */
    --content-container-width: 100%;
    --content-max-width: 100%;

    /* Overrides */
    --bordered-content-outer-container-width: var(--content-container-width);
    --bordered-content-max-width: var(--content-max-width);

    /* Rules */
    ${() => layoutMixins.flexColumn}
    isolation: isolate;
    /* $ {() => layoutMixins.scrollArea} */
  `,

  // A content container with dynamic padding and children with a max width of --content-max-width
  contentContainerPage: css`
    /* Overrides */
    ${() => layoutMixins.contentContainer}
    --content-container-width: 100vw;
    --content-max-width: var(--default-page-content-max-width);

    /* Computed */
    --contentContainerPage-paddingLeft: calc(
      (var(--content-container-width) - var(--content-max-width)) / 2
    );
    --contentContainerPage-paddingRight: calc(
      (var(--content-container-width) - var(--content-max-width)) / 2
    );

    /* Rules */
    ${() => layoutMixins.stickyHeaderArea}
    ${() => layoutMixins.scrollSnapItem}

    min-height: 100%;
    /* height: max-content; */

    --padding-y: clamp(0rem, (var(--content-container-width) - var(--content-max-width)) / 2, 2rem);
    padding-top: var(--padding-y);
    padding-bottom: var(--padding-y);
    scroll-padding-top: var(--padding-y);
    scroll-padding-bottom: var(--padding-y);

    padding-left: var(--contentContainerPage-paddingLeft);
    padding-right: var(--contentContainerPage-paddingRight);
  `,

  // Section
  // Use within contentContainer or contentContainerPage
  contentSection: css`
    ${() => layoutMixins.scrollSnapItem}
  `,

  // Section containing horizontally-overflowing content that scrolls with the outer scrollArea
  // Use within contentContainer or contentContainerPage
  contentSectionAttached: css`
    ${() => layoutMixins.contentSection}
    min-width: max-content;
    /* max-width: none; */
  `,

  // Section that defines its own horizontal scrollArea and does not scroll with the outer scrollArea
  // Use within contentContainer or contentContainerPage
  contentSectionDetached: css`
    ${() => layoutMixins.contentSection}
    ${() => layoutMixins.stickyLeft}

    max-width: min(var(--content-container-width), var(--content-max-width));
    transition: max-width 0.3s var(--ease-out-expo);
  `,

  // Section that defines its own horizontal scrollArea and does not scroll with the outer scrollArea
  // Use within contentContainer or contentContainerPage
  contentSectionDetachedScrollable: css`
    ${() => layoutMixins.contentSectionDetached}
    ${() => layoutMixins.scrollArea}
  `,

  sticky: css`
    /* Params */
    --stickyArea-totalInsetTop: ;
    --stickyArea-totalInsetBottom: ;
    --stickyArea-totalInsetLeft: ;
    --stickyArea-totalInsetRight: ;

    z-index: 1;

    position: sticky;
    inset: 0;
    top: var(--stickyArea-totalInsetTop, 0px);
    bottom: var(--stickyArea-totalInsetBottom, 0px);
    left: var(--stickyArea-totalInsetLeft, 0px);
    right: var(--stickyArea-totalInsetRight, 0px);

    backdrop-filter: blur(10px);
  `,

  // An item within a horizontally scrollable container that is unaffected by the horizontal scroll position.
  // Use when a sibling is horizontally overflowing (e.g. a table with many columns).
  stickyLeft: css`
    z-index: 1;

    position: sticky;
    left: var(--stickyArea-totalInsetLeft, 0px);

    transition: left 0.3s var(--ease-out-expo);
  `,

  stickyRight: css`
    z-index: 1;

    position: sticky;
    right: var(--stickyArea-totalInsetRight, 0px);

    transition: right 0.3s var(--ease-out-expo);
  `,

  // Creates a scrollable container that can contain sticky and/or scroll-snapped descendants.
  scrollArea: css`
    /* Params */
    --scrollArea-height: 100%;
    --scrollArea-width: 100%;

    /* Rules */

    isolation: isolate;

    height: var(--scrollArea-height);

    position: relative;
    overflow: auto;

    /* scroll-snap-type: both proximity; */

    @media (prefers-reduced-motion: no-preference) {
      scroll-behavior: smooth;
    }
  `,

  /**
   * A container for positioning sticky items using simulated padding, width, height and gap properties.
   * Use on layoutMixins.scrollArea or as a descendant of layoutMixins.scrollArea
   */
  stickyArea: css`
    /* Params */
    --stickyArea-paddingTop: ;
    --stickyArea-height: var(--scrollArea-height, 100%);
    --stickyArea-topHeight: ;
    --stickyArea-topGap: ;
    --stickyArea-bottomGap: ;
    --stickyArea-paddingBottom: ;
    --stickyArea-bottomHeight: ;
    --stickyArea-paddingLeft: ;

    --stickyArea-width: var(--scrollArea-width, 100%);
    --stickyArea-leftWidth: ;
    --stickyArea-leftGap: ;
    --stickyArea-paddingRight: ;
    --stickyArea-rightGap: ;
    --stickyArea-rightWidth: ;

    --stickyArea-background: ;

    /* Computed */
    --stickyArea-totalInsetTop: var(--stickyArea-paddingTop);
    --stickyArea-totalInsetBottom: var(--stickyArea-paddingBottom);
    --stickyArea-innerHeight: calc(
      var(--stickyArea-height, 100%) -
        (
          var(--stickyArea-paddingTop, 0px) + var(--stickyArea-topHeight, 0px) +
            var(--stickyArea-topGap, 0px)
        ) -
        (
          var(--stickyArea-paddingBottom, 0px) + var(--stickyArea-bottomHeight, 0px) +
            var(--stickyArea-bottomGap, 0px)
        )
    );

    --stickyArea-totalInsetLeft: var(--stickyArea-paddingLeft);
    --stickyArea-totalInsetRight: var(--stickyArea-paddingRight);
    --stickyArea-innerWidth: calc(
      var(--stickyArea-width, 100%) -
        (
          var(--stickyArea-paddingLeft, 0px) + var(--stickyArea-leftWidth, 0px) +
            var(--stickyArea-leftGap, 0px)
        ) -
        (
          var(--stickyArea-paddingRight, 0px) + var(--stickyArea-rightWidth, 0px) +
            var(--stickyArea-rightGap, 0px)
        )
    );

    /* Rules */
    /* scroll-padding-top: var(--stickyArea-topHeight);
    scroll-padding-bottom: var(--stickyArea-bottomHeight); */
    /* scroll-padding-top: var(--stickyArea-totalInsetTop);
    scroll-padding-bottom: var(--stickyArea-totalInsetBottom); */
    /* scroll-padding-block-end: 4rem; */

    /* Firefox: opaque background required for backdrop-filter to work */
    background: var(--stickyArea-background, var(--color-layer-2));
  `,

  /**
   * A sticky area that may contain nested sticky areas.
   * Use with layoutMixins.scrollArea or as a descendant of layoutMixins.scrollArea
   */
  stickyArea0: css`
    /* Params */
    --stickyArea0-paddingTop: 0px;
    --stickyArea0-topHeight: 0px;
    --stickyArea0-topGap: 0px;
    --stickyArea0-bottomGap: 0px;
    --stickyArea0-bottomHeight: 0px;
    --stickyArea0-paddingBottom: 0px;

    --stickyArea0-paddingLeft: 0px;
    --stickyArea0-leftWidth: 0px;
    --stickyArea0-leftGap: 0px;
    --stickyArea0-rightGap: 0px;
    --stickyArea0-rightWidth: 0px;
    --stickyArea0-paddingRight: 0px;

    --stickyArea0-background: ;

    /* Computed */
    --stickyArea0-height: var(--scrollArea-height, 100%);
    --stickyArea0-totalInsetTop: var(--stickyArea0-paddingTop);
    --stickyArea0-totalInsetBottom: var(--stickyArea0-paddingBottom);

    --stickyArea0-width: var(--scrollArea-width, 100%);
    --stickyArea0-totalInsetLeft: var(--stickyArea0-paddingLeft);
    --stickyArea0-totalInsetRight: var(--stickyArea0-paddingRight);

    /* Rules */
    ${() => layoutMixins.stickyArea}

    --stickyArea-height: var(--stickyArea0-height);
    --stickyArea-totalInsetTop: var(--stickyArea0-totalInsetTop);
    --stickyArea-paddingTop: var(--stickyArea0-paddingTop);
    --stickyArea-topHeight: var(--stickyArea0-topHeight);
    --stickyArea-topGap: var(--stickyArea0-topGap);
    --stickyArea-innerHeight: var(--stickyArea1-height);
    --stickyArea-bottomGap: var(--stickyArea0-bottomGap);
    --stickyArea-bottomHeight: var(--stickyArea0-bottomHeight);
    --stickyArea-paddingBottom: var(--stickyArea0-paddingBottom);
    --stickyArea-totalInsetBottom: var(--stickyArea0-totalInsetBottom);

    --stickyArea-width: var(--stickyArea0-width);
    --stickyArea-totalInsetLeft: var(--stickyArea0-totalInsetLeft);
    --stickyArea-paddingLeft: var(--stickyArea0-paddingLeft);
    --stickyArea-leftWidth: var(--stickyArea0-leftWidth);
    --stickyArea-leftGap: var(--stickyArea0-leftGap);
    --stickyArea-innerWidth: var(--stickyArea1-width);
    --stickyArea-rightGap: var(--stickyArea0-rightGap);
    --stickyArea-rightWidth: var(--stickyArea0-rightWidth);
    --stickyArea-paddingRight: var(--stickyArea0-paddingRight);
    --stickyArea-totalInsetRight: var(--stickyArea0-totalInsetRight);

    --stickyArea-background: var(--stickyArea0-background);
  `,

  /**
   * A nested sticky area that calculates sticky item inset values cumulatively.
   * Use as a descendant of layoutMixins.stickyArea0
   */
  stickyArea1: css`
    /* Params */
    --stickyArea1-paddingTop: 0px;
    --stickyArea1-topHeight: 0px;
    --stickyArea1-topGap: 0px;
    --stickyArea1-bottomGap: 0px;
    --stickyArea1-bottomHeight: 0px;
    --stickyArea1-paddingBottom: 0px;

    --stickyArea1-paddingLeft: 0px;
    --stickyArea1-leftWidth: 0px;
    --stickyArea1-leftGap: 0px;
    --stickyArea1-rightGap: 0px;
    --stickyArea1-rightWidth: 0px;
    --stickyArea1-paddingRight: 0px;

    --stickyArea1-background: ;

    /* Computed */

    --stickyArea1-height: calc(
      var(--stickyArea0-height) -
        (var(--stickyArea0-paddingTop) + var(--stickyArea0-topHeight) + var(--stickyArea0-topGap)) -
        (
          var(--stickyArea0-paddingBottom) + var(--stickyArea0-bottomHeight) +
            var(--stickyArea0-bottomGap)
        )
    );
    --stickyArea1-totalInsetTop: calc(
      var(--stickyArea0-totalInsetTop) + var(--stickyArea0-topHeight) + var(--stickyArea0-topGap) +
        var(--stickyArea1-paddingTop)
    );
    --stickyArea1-totalInsetBottom: calc(
      var(--stickyArea0-totalInsetBottom) + var(--stickyArea0-bottomHeight) +
        var(--stickyArea0-bottomGap) + var(--stickyArea1-paddingBottom)
    );

    --stickyArea1-width: calc(
      var(--stickyArea0-width) -
        (var(--stickyArea0-paddingLeft) + var(--stickyArea0-leftWidth) + var(--stickyArea0-leftGap)) -
        (
          var(--stickyArea0-paddingRight) + var(--stickyArea0-rightWidth) +
            var(--stickyArea0-rightGap)
        )
    );
    --stickyArea1-totalInsetLeft: calc(
      var(--stickyArea0-totalInsetLeft) + var(--stickyArea0-leftWidth) + var(--stickyArea0-leftGap) +
        var(--stickyArea1-paddingLeft)
    );
    --stickyArea1-totalInsetRight: calc(
      var(--stickyArea0-totalInsetRight) + var(--stickyArea0-rightWidth) +
        var(--stickyArea0-rightGap) + var(--stickyArea1-paddingRight)
    );

    /* Rules */
    ${() => layoutMixins.stickyArea}

    --stickyArea-height: var(--stickyArea1-height);
    --stickyArea-totalInsetTop: var(--stickyArea1-totalInsetTop);
    --stickyArea-paddingTop: var(--stickyArea1-paddingTop);
    --stickyArea-topHeight: var(--stickyArea1-topHeight);
    --stickyArea-topGap: var(--stickyArea1-topGap);
    --stickyArea-innerHeight: var(--stickyArea2-height);
    --stickyArea-bottomGap: var(--stickyArea1-bottomGap);
    --stickyArea-bottomHeight: var(--stickyArea1-bottomHeight);
    --stickyArea-paddingBottom: var(--stickyArea1-paddingBottom);
    --stickyArea-totalInsetBottom: var(--stickyArea1-totalInsetBottom);

    --stickyArea-width: var(--stickyArea1-width);
    --stickyArea-totalInsetLeft: var(--stickyArea1-totalInsetLeft);
    --stickyArea-paddingLeft: var(--stickyArea1-paddingLeft);
    --stickyArea-leftWidth: var(--stickyArea1-leftWidth);
    --stickyArea-leftGap: var(--stickyArea1-leftGap);
    --stickyArea-innerWidth: var(--stickyArea2-width);
    --stickyArea-rightGap: var(--stickyArea1-rightGap);
    --stickyArea-rightWidth: var(--stickyArea1-rightWidth);
    --stickyArea-paddingRight: var(--stickyArea1-paddingRight);
    --stickyArea-totalInsetRight: var(--stickyArea1-totalInsetRight);

    --stickyArea-background: var(--stickyArea1-background);
  `,

  /**
   * A nested sticky area that calculates sticky item inset values cumulatively.
   * Use as a descendant of layoutMixins.stickyArea1
   */
  stickyArea2: css`
    /* Params */
    --stickyArea2-paddingTop: 0px;
    --stickyArea2-topHeight: 0px;
    --stickyArea2-topGap: 0px;
    --stickyArea2-bottomGap: 0px;
    --stickyArea2-bottomHeight: 0px;
    --stickyArea2-paddingBottom: 0px;

    --stickyArea2-paddingLeft: 0px;
    --stickyArea2-leftWidth: 0px;
    --stickyArea2-leftGap: 0px;
    --stickyArea2-rightGap: 0px;
    --stickyArea2-rightWidth: 0px;
    --stickyArea2-paddingRight: 0px;

    --stickyArea2-background: ;

    /* Computed */
    --stickyArea2-height: calc(
      var(--stickyArea1-height) -
        (var(--stickyArea1-paddingTop) + var(--stickyArea1-topHeight) + var(--stickyArea1-topGap)) -
        (
          var(--stickyArea1-paddingBottom) + var(--stickyArea1-bottomHeight) +
            var(--stickyArea1-bottomGap)
        )
    );
    --stickyArea2-totalInsetTop: calc(
      var(--stickyArea1-totalInsetTop) + var(--stickyArea1-topHeight) + var(--stickyArea1-topGap) +
        var(--stickyArea2-paddingTop)
    );
    --stickyArea2-totalInsetBottom: calc(
      var(--stickyArea1-totalInsetBottom) + var(--stickyArea1-bottomHeight) +
        var(--stickyArea1-bottomGap) + var(--stickyArea2-paddingBottom)
    );

    --stickyArea2-width: calc(
      var(--stickyArea1-width) -
        (var(--stickyArea1-paddingLeft) + var(--stickyArea1-leftWidth) + var(--stickyArea1-leftGap)) -
        (
          var(--stickyArea1-paddingRight) + var(--stickyArea1-rightWidth) +
            var(--stickyArea1-rightGap)
        )
    );
    --stickyArea2-totalInsetLeft: calc(
      var(--stickyArea1-totalInsetLeft) + var(--stickyArea1-leftWidth) + var(--stickyArea1-leftGap) +
        var(--stickyArea2-paddingLeft)
    );
    --stickyArea2-totalInsetRight: calc(
      var(--stickyArea1-totalInsetRight) + var(--stickyArea1-rightWidth) +
        var(--stickyArea1-rightGap) + var(--stickyArea2-paddingRight)
    );

    /* Rules */
    ${() => layoutMixins.stickyArea}

    --stickyArea-height: var(--stickyArea2-height);
    --stickyArea-totalInsetTop: var(--stickyArea2-totalInsetTop);
    --stickyArea-paddingTop: var(--stickyArea2-paddingTop);
    --stickyArea-topHeight: var(--stickyArea2-topHeight);
    --stickyArea-topGap: var(--stickyArea2-topGap);
    --stickyArea-innerHeight: var(--stickyArea3-height);
    --stickyArea-bottomGap: var(--stickyArea2-bottomGap);
    --stickyArea-bottomHeight: var(--stickyArea2-bottomHeight);
    --stickyArea-paddingBottom: var(--stickyArea2-paddingBottom);
    --stickyArea-totalInsetBottom: var(--stickyArea2-totalInsetBottom);

    --stickyArea-width: var(--stickyArea2-width);
    --stickyArea-totalInsetLeft: var(--stickyArea2-totalInsetLeft);
    --stickyArea-paddingLeft: var(--stickyArea2-paddingLeft);
    --stickyArea-leftWidth: var(--stickyArea2-leftWidth);
    --stickyArea-leftGap: var(--stickyArea2-leftGap);
    --stickyArea-innerWidth: var(--stickyArea3-width);
    --stickyArea-rightGap: var(--stickyArea2-rightGap);
    --stickyArea-rightWidth: var(--stickyArea2-rightWidth);
    --stickyArea-paddingRight: var(--stickyArea2-paddingRight);
    --stickyArea-totalInsetRight: var(--stickyArea2-totalInsetRight);

    --stickyArea-background: var(--stickyArea2-background);
  `,

  /**
   * A nested sticky area that calculates sticky item inset values cumulatively.
   * Use as a descendant of layoutMixins.stickyArea2
   */
  stickyArea3: css`
    /* Params */
    --stickyArea3-paddingTop: 0px;
    --stickyArea3-topHeight: 0px;
    --stickyArea3-topGap: 0px;
    --stickyArea3-bottomGap: 0px;
    --stickyArea3-bottomHeight: 0px;
    --stickyArea3-paddingBottom: 0px;

    --stickyArea3-paddingLeft: 0px;
    --stickyArea3-leftWidth: 0px;
    --stickyArea3-leftGap: 0px;
    --stickyArea3-rightGap: 0px;
    --stickyArea3-rightWidth: 0px;
    --stickyArea3-paddingRight: 0px;

    --stickyArea3-background: ;

    /* Computed */
    --stickyArea3-height: calc(
      var(--stickyArea2-height) -
        (var(--stickyArea2-paddingTop) + var(--stickyArea2-topHeight) + var(--stickyArea2-topGap)) -
        (
          var(--stickyArea2-paddingBottom) + var(--stickyArea2-bottomHeight) +
            var(--stickyArea2-bottomGap)
        )
    );
    --stickyArea3-totalInsetTop: calc(
      var(--stickyArea2-totalInsetTop) + var(--stickyArea2-topHeight) + var(--stickyArea2-topGap) +
        var(--stickyArea3-paddingTop)
    );
    --stickyArea3-totalInsetBottom: calc(
      var(--stickyArea2-totalInsetBottom) + var(--stickyArea2-bottomHeight) +
        var(--stickyArea2-bottomGap) + var(--stickyArea3-paddingBottom)
    );

    --stickyArea3-width: calc(
      var(--stickyArea2-width) -
        (var(--stickyArea2-paddingLeft) + var(--stickyArea2-leftWidth) + var(--stickyArea2-leftGap)) -
        (
          var(--stickyArea2-paddingRight) + var(--stickyArea2-rightWidth) +
            var(--stickyArea2-rightGap)
        )
    );
    --stickyArea3-totalInsetLeft: calc(
      var(--stickyArea2-totalInsetLeft) + var(--stickyArea2-leftWidth) + var(--stickyArea2-leftGap) +
        var(--stickyArea3-paddingLeft)
    );
    --stickyArea3-totalInsetRight: calc(
      var(--stickyArea2-totalInsetRight) + var(--stickyArea2-rightWidth) +
        var(--stickyArea2-rightGap) + var(--stickyArea3-paddingRight)
    );

    /* Rules */
    ${() => layoutMixins.stickyArea}

    --stickyArea-height: var(--stickyArea3-height);
    --stickyArea-totalInsetTop: var(--stickyArea3-totalInsetTop);
    --stickyArea-paddingTop: var(--stickyArea3-paddingTop);
    --stickyArea-topHeight: var(--stickyArea3-topHeight);
    --stickyArea-topGap: var(--stickyArea3-topGap);
    --stickyArea-innerHeight: var(--stickyArea4-height);
    --stickyArea-bottomGap: var(--stickyArea3-bottomGap);
    --stickyArea-bottomHeight: var(--stickyArea3-bottomHeight);
    --stickyArea-paddingBottom: var(--stickyArea3-paddingBottom);
    --stickyArea-totalInsetBottom: var(--stickyArea3-totalInsetBottom);

    --stickyArea-width: var(--stickyArea3-width);
    --stickyArea-totalInsetLeft: var(--stickyArea3-totalInsetLeft);
    --stickyArea-paddingLeft: var(--stickyArea3-paddingLeft);
    --stickyArea-leftWidth: var(--stickyArea3-leftWidth);
    --stickyArea-leftGap: var(--stickyArea3-leftGap);
    --stickyArea-innerWidth: var(--stickyArea4-width);
    --stickyArea-rightGap: var(--stickyArea3-rightGap);
    --stickyArea-rightWidth: var(--stickyArea3-rightWidth);
    --stickyArea-paddingRight: var(--stickyArea3-paddingRight);
    --stickyArea-totalInsetRight: var(--stickyArea3-totalInsetRight);

    --stickyArea-background: var(--stickyArea3-background);
  `,

  // Use as a descendant of layoutMixins.stickyArea
  stickyHeader: css`
    ${() => layoutMixins.sticky}
    min-height: var(--stickyArea-topHeight);
    flex-shrink: 0;

    ${() => layoutMixins.scrollSnapItem}
  `,

  // Use as a descendant of layoutMixins.stickyArea
  stickyFooter: css`
    ${() => layoutMixins.sticky}
    min-height: var(--stickyArea-bottomHeight);
    flex-shrink: 0;

    ${() => layoutMixins.scrollSnapItem}
  `,

  // Use as a descendant of layoutMixins.scrollArea
  scrollSnapItem: css`
    scroll-snap-align: start;

    scroll-margin-top: var(--stickyArea-totalInsetTop);
    scroll-margin-bottom: var(--stickyArea-totalInsetBottom);
    scroll-margin-left: var(--stickyArea-totalInsetLeft);
    scroll-margin-right: var(--stickyArea-totalInsetRight);
  `,

  // Use with layoutMixins.stickyFooter
  withStickyFooterBackdrop: css`
    /* Params */
    --stickyFooterBackdrop-outsetY: ;
    --stickyFooterBackdrop-outsetX: ;

    /* Rules */
    backdrop-filter: none;

    &:before {
      content: '';

      z-index: -1;
      position: absolute;
      inset: calc(-1 * var(--stickyFooterBackdrop-outsetY, 0px))
        calc(-1 * var(--stickyFooterBackdrop-outsetX, 0px));

      background: linear-gradient(transparent, var(--stickyArea-background));

      pointer-events: none;
    }
  `,

  withOuterBorder: css`
    box-shadow: 0 0 0 var(--border-width) var(--border-color);
  `,

  // Show "borders" between and around grid/flex items using gap + box-shadow
  // Apply to element with display: grid or display: flex
  withOuterAndInnerBorders: css`
    --border-width: var(--default-border-width);
    --border-color: var(--color-border);

    gap: var(--border-width);

    > * {
      ${() => layoutMixins.withOuterBorder}
    }
  `,

  withInnerHorizontalBorders: css`
    --border-width: var(--default-border-width);
    --border-color: var(--color-border);

    gap: var(--border-width);

    > * {
      box-shadow: 0 var(--border-width) var(--border-color),
        0 calc(-1 * var(--border-width)) var(--border-color);
    }
  `,

  // An outer border with a dynamic radius + clip effect based on a "max" width and the current container width.
  withOuterBorderClipped: css`
    /* Parameters */

    --bordered-content-outer-container-width: inherit;
    --bordered-content-max-width: inherit;
    --bordered-content-border-radius: 1rem;

    --border-width: var(--default-border-width);
    --border-color: var(--color-border);

    /* Computed */

    --computed-radius: clamp(
      0px,
      var(--bordered-content-outer-container-width) - var(--bordered-content-max-width),
      var(--bordered-content-border-radius)
    );

    /* Rules */

    clip-path: inset(
      calc(-1 * var(--border-width)) round calc(var(--computed-radius) + var(--border-width))
    );
    overflow-clip-margin: var(--border-width);

    position: relative;

    &:after {
      content: '';

      z-index: 2;

      position: absolute;
      inset: 0;

      border-radius: var(--computed-radius);
      ${() => layoutMixins.withOuterBorder}

      pointer-events: none;
    }
  `,

  textOverflow: css`
    display: inline-block;
    overflow-x: auto;

    &:not(:hover) {
      text-overflow: ellipsis;
      scroll-snap-type: x proximity;

      // Reset scroll position when mouse leaves
      animation: ${keyframes`
        from {
          zoom: 0.0001;
        }
      `} 0.1ms;
    }

    * {
      display: inline !important;
    }

    scrollbar-width: none;
    ::-webkit-scrollbar {
      display: none;
    }
  `,

  absolute: css`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  `,

  expandingColumnWithStickyFooter: css`
    // Expand if within a flexColumn
    flex: 1;

    display: grid;
    grid-template:
      minmax(0, 1fr)
      auto
      / minmax(0, 1fr);
    align-items: start;

    > :last-child {
      ${() => layoutMixins.stickyFooter}
      ${() => layoutMixins.withStickyFooterBackdrop}
    }
  `,

  noPointerEvents: css`
    pointer-events: none;

    > * {
      pointer-events: initial;
    }
  `,

  centered: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-height: 100%;
    place-items: center;
  `,
};
