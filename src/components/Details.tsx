import { Fragment } from 'react';

import styled, {
  type AnyStyledComponent,
  css,
  type FlattenInterpolation,
  ThemeProps,
} from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { WithSeparators } from '@/components/Separator';
import { WithTooltip } from '@/components/WithTooltip';

import { LoadingContext } from '@/contexts/LoadingContext';

export type DetailsItem = {
  key: string;
  tooltip?: string;
  tooltipParams?: Record<string, string>;
  label: string | JSX.Element;
  value?: string | JSX.Element | undefined;
  subitems?: DetailsItem[];
  withTooltipIcon?: boolean;
};

const DETAIL_LAYOUTS = {
  column: 'column',
  row: 'row',
  rowColumns: 'row',
  grid: 'row',
  stackColumn: 'column',
} as const;

const DETAIL_ITEM_TOOLTIP_LAYOUTS = {
  column: 'left',
  row: 'top',
  rowColumns: 'top',
  grid: undefined,
  stackColumn: 'top',
} as const;

type ElementProps = {
  showSubitems?: boolean;
  items: DetailsItem[];
  isLoading?: boolean;
};

type StyleProps = {
  layout?: 'column' | 'row' | 'rowColumns' | 'grid' | 'stackColumn';
  justifyItems?: 'start' | 'end';
  withSeparators?: boolean;
  withOverflow?: boolean;
  className?: string;
};

const DetailItem = ({
  tooltip,
  tooltipParams,
  label,
  value,
  withTooltipIcon,
  justifyItems,
  layout = 'column',
  withOverflow,
}: DetailsItem & StyleProps) => (
  <Styled.Item justifyItems={justifyItems} layout={layout} withOverflow={withOverflow}>
    <dt>
      <WithTooltip
        tooltip={tooltip}
        stringParams={tooltipParams}
        side={DETAIL_ITEM_TOOLTIP_LAYOUTS[layout]}
        withIcon={withTooltipIcon}
      >
        {label}
      </WithTooltip>
    </dt>
    <dd>{value ?? ''}</dd>
  </Styled.Item>
);

export const Details = ({
  className,
  showSubitems,
  items,
  isLoading = false,
  justifyItems = 'start',
  layout = 'column',
  withOverflow = true,
  withSeparators = false,
}: ElementProps & StyleProps) => (
  <LoadingContext.Provider value={isLoading}>
    <Styled.Details layout={layout} withSeparators={withSeparators} className={className}>
      <WithSeparators withSeparators={withSeparators} layout={DETAIL_LAYOUTS[layout]}>
        {items.map(({ key, tooltip, tooltipParams, label, subitems, value, withTooltipIcon }) => (
          <Fragment key={key}>
            <DetailItem
              {...{
                key,
                tooltip,
                tooltipParams,
                label,
                value,
                withTooltipIcon,
                justifyItems,
                layout,
                withOverflow,
              }}
            />
            {subitems && showSubitems && layout === 'column' && (
              <Styled.SubDetails
                items={subitems}
                layout={DETAIL_LAYOUTS[layout]}
                withSeparators={withSeparators}
              />
            )}
          </Fragment>
        ))}
      </WithSeparators>
    </Styled.Details>
  </LoadingContext.Provider>
);

const detailsLayoutVariants = {
  column: css`
    ${layoutMixins.column}
  `,

  stackColumn: css`
    ${layoutMixins.flexColumn}
  `,

  row: css`
    ${layoutMixins.row}
    align-self: stretch;
    white-space: nowrap;
  `,

  rowColumns: css`
    ${layoutMixins.row}
  `,

  grid: css`
    display: grid;
    grid-template-columns: repeat(
      var(--details-grid-numColumns),
      calc(100% / var(--details-grid-numColumns))
    );
  `,
};

const itemLayoutVariants: Record<string, FlattenInterpolation<ThemeProps<any>>> = {
  column: css`
    isolation: isolate;

    ${layoutMixins.scrollArea}

    ${layoutMixins.stickyArea0}
    --stickyArea0-background: var(--details-item-backgroundColor);

    ${layoutMixins.spacedRow}
    gap: 0.5rem;
    align-items: start;
    padding: 0.5rem 0;

    min-height: var(--details-item-height);

    > :first-child > abbr {
      min-width: auto;
    }

    > :last-child {
      ${layoutMixins.row}
      ${layoutMixins.stickyRight}

      background-color: var(--details-item-backgroundColor);
      box-shadow: -0.25rem 0 0.25rem var(--details-item-backgroundColor);
    }
  `,

  stackColumn: css`
    ${layoutMixins.column}
    padding: 0.75rem 0;
    > :first-child {
      margin-bottom: 0.5rem;
    }
  `,

  row: css`
    ${layoutMixins.row}
    ${layoutMixins.scrollSnapItem}

    gap: 0.1875rem 0.66rem;
    padding: 0 1rem;
  `,

  rowColumns: css`
    ${layoutMixins.rowColumn}
    ${layoutMixins.scrollSnapItem}

    gap: 0.1875rem 0.66rem;
    padding: 0 1rem;
  `,

  grid: css`
    display: grid;
    align-content: space-evenly;
    justify-items: start;
    gap: 0.375rem;
  `,
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Details = styled.dl<{
  layout: 'column' | 'row' | 'rowColumns' | 'grid' | 'stackColumn';
  withSeparators: boolean;
}>`
  --details-item-height: 2rem;
  --details-item-backgroundColor: transparent;
  --details-subitem-borderWidth: 2px;
  --details-grid-numColumns: 2;

  ${({ layout }) => layout && detailsLayoutVariants[layout]}
`;

Styled.Item = styled.div<{
  layout: 'column' | 'row' | 'rowColumns' | 'grid' | 'stackColumn';
  justifyItems?: 'start' | 'end';
  withOverflow: boolean;
}>`
  ${({ layout }) => layout && itemLayoutVariants[layout]}

  ${({ justifyItems }) =>
    justifyItems === 'end' &&
    css`
      > :nth-child(even) {
        justify-items: end;
        text-align: end;
      }
    `}

  ${({ layout, withOverflow }) =>
    layout &&
    withOverflow &&
    {
      column: css`
        &:not(:hover) > :first-child {
          white-space: nowrap;
          overflow-x: hidden;
          text-overflow: ellipsis;
        }
      `,
      stackColumn: css``,
      row: css``,
      rowColumns: css``,
      grid: css`
        &:not(:hover) > :first-child {
          overflow-x: hidden;
          text-overflow: ellipsis;
        }
      `,
    }[layout]}

  /* > label { */
  /* > dt { */
  > :first-child {
    color: var(--color-text-0);

    // Tooltip Icon centering when display: inline
    > abbr > svg {
      margin-bottom: -0.125rem;
      margin-left: 0.25rem;
    }
  }

  /* > span { */
  /* dd */
  > :last-child {
    font: var(--details-value-font, inherit);
    gap: 0.25rem;
    display: flex;
    flex-direction: row;

    &:empty:after {
      content: '–';
      color: var(--color-text-0);
      opacity: 0.5;
    }
  }
`;

Styled.SubDetails = styled(Details)`
  padding-left: 1rem;
  position: relative;

  &:before {
    content: '';
    background-color: var(--color-border);
    position: absolute;
    bottom: 0.25rem;
    top: 0.25rem;
    left: 0;
    width: var(--details-subitem-borderWidth);
    border-radius: 0.25rem;
  }
`;
