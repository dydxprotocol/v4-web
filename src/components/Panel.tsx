import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  slotHeaderContent?: React.ReactNode;
  slotHeader?: React.ReactNode;
  slotRight?: React.ReactNode;
  children?: React.ReactNode;
  href?: string;
  onHeaderClick?: () => void;
  onClick?: () => void;
};

type StyleProps = {
  className?: string;
  hasSeparator?: boolean;
};

export type PanelProps = ElementProps & StyleProps;

export const Panel = ({
  slotHeaderContent,
  slotHeader,
  slotRight,
  children,
  href,
  onHeaderClick,
  onClick,
  hasSeparator,
  className,
}: PanelProps) => (
  <$Panel onClick={onClick} className={className}>
    <div tw="w-full flexColumn">
      {href ? (
        <Link to={href}>
          {slotHeader ?? (
            <$Header role="button" onClick={onHeaderClick} hasSeparator={hasSeparator}>
              {slotHeaderContent}
              <Icon iconName={IconName.ChevronRight} tw="text-[0.625rem] text-text-0" />
            </$Header>
          )}
        </Link>
      ) : (
        slotHeader ??
        (slotHeaderContent && (
          <$Header role="button" onClick={onHeaderClick} hasSeparator={hasSeparator}>
            {slotHeaderContent}
          </$Header>
        ))
      )}
      <$Content>{children}</$Content>
    </div>
    {slotRight}
  </$Panel>
);
const $Panel = styled.section<{ onClick?: () => void }>`
  --panel-paddingY: 1rem;
  --panel-paddingX: 1rem;
  --panel-content-paddingY: var(--panel-paddingY);
  --panel-content-paddingX: var(--panel-paddingX);
  --panel-border-radius: 0.875rem;

  @media ${breakpoints.notTablet} {
    --panel-paddingX: 1.5rem;
    --panel-paddingY: 1.25rem;
    --panel-content-paddingY: 1rem;
  }

  ${layoutMixins.row}

  background-color: var(--color-layer-3);
  border-radius: var(--panel-border-radius);

  ${({ onClick }) =>
    onClick &&
    css`
      cursor: pointer;

      &:hover {
        button:not(:disabled) {
          color: var(--button-hover-textColor);
          filter: var(--button-hover-filter);
        }
      }
    `}
`;
const $Header = styled.header<{ hasSeparator?: boolean }>`
  ${layoutMixins.spacedRow}
  padding: var(--panel-paddingY) var(--panel-paddingX);

  ${({ hasSeparator }) =>
    hasSeparator &&
    css`
      padding-bottom: 0.625rem;
      box-shadow: 0 var(--border-width) var(--border-color);
    `}
`;
const $Content = styled.div`
  ${layoutMixins.scrollArea}
  ${layoutMixins.stickyArea0}
  --stickyArea0-background: transparent;
  padding: var(--panel-content-paddingY) var(--panel-content-paddingX);
`;
