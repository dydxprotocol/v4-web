import type { Story } from '@ladle/react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { StoryWrapper } from '.ladle/components';

const FONT_SIZES = ['tiny', 'mini', 'small', 'base', 'medium', 'large', 'extra'];

export const TextStory: Story = () => (
  <StoryWrapper>
    <Styled.Table>
      <thead>
        <tr>
          <th>Regular(-)</th>
          <th>Book</th>
          <th>Medium(+)</th>
          <th>Mono(#)</th>
        </tr>
      </thead>
      <tbody>
        {FONT_SIZES.map((size) => (
          <tr key={size}>
            <td
              style={{
                font: `var(--font-${size}-regular)`,
              }}
            >{`${size}-`}</td>
            <td
              style={{
                font: `var(--font-${size}-book)`,
              }}
            >
              {size}
            </td>
            <td
              style={{
                font: `var(--font-${size}-medium)`,
              }}
            >{`${size}+`}</td>
            <td
              style={{
                font: `var(--font-${size}-book)`,
                fontFeatureSettings: 'var(--fontFeature-monoNumbers)',
              }}
            >
              123,456
            </td>
          </tr>
        ))}
      </tbody>
    </Styled.Table>
  </StoryWrapper>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: separate;
  border-spacing: 0 var(--border-width);

  --default-border-width: 1px;
  ${layoutMixins.withOuterAndInnerBorders}

  thead,
  tbody {
    ${layoutMixins.withInnerHorizontalBorders}
  }

  th {
    padding: 0.5rem 0.25rem;
  }

  td {
    padding: 0.25rem;
  }
`;
