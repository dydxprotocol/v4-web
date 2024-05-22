import styled from 'styled-components';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  title: string;
  subtitle?: React.ReactNode;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;
};

type StyleProps = {
  className?: string;
};

export const ContentSectionHeader = ({
  title,
  subtitle,
  slotLeft,
  slotRight,
  className,
}: ElementProps & StyleProps) => (
  <$ContentSectionHeader className={className}>
    {slotLeft}
    <$Header>
      {title && <h3>{title}</h3>}
      {subtitle && <p>{subtitle}</p>}
    </$Header>
    {slotRight}
  </$ContentSectionHeader>
);
const $ContentSectionHeader = styled.header<StyleProps>`
  ${layoutMixins.contentSectionDetached}

  ${layoutMixins.row}
  justify-content: space-between;

  --header-horizontal-padding: 1rem;

  padding: 1rem var(--header-horizontal-padding);

  @media ${breakpoints.tablet} {
    flex-wrap: wrap;
    --header-horizontal-padding: 1.25rem;
  }
`;

const $Header = styled.div`
  ${layoutMixins.column}
  flex: 1;

  h3 {
    color: var(--color-text-2);
    font: var(--font-large-medium);
  }

  p {
    color: var(--color-text-0);
    font: var(--font-small-book);
    margin-top: 0.25rem;
  }
`;
