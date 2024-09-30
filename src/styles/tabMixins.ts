import { css } from 'styled-components';

import { layoutMixins } from './layoutMixins';

const tabTriggerStyle = css`
  ${layoutMixins.row}
  justify-content: center;
  gap: 0.5ch;

  align-self: stretch;
  padding: 0 1.5rem;

  font: var(--trigger-font, var(--font-base-book));
  color: var(--trigger-textColor);
  background-color: var(--trigger-backgroundColor);

  &[data-state='active'] {
    color: var(--trigger-active-textColor);
    background-color: var(--trigger-active-backgroundColor);
  }
`;

const tabTriggerUnderlineStyle = css`
  box-shadow: inset 0 calc(var(--trigger-underline-size) * -1) 0 var(--trigger-active-textColor);

  &[data-state='active'] {
    box-shadow: inset 0 calc(var(--trigger-active-underline-size) * -1) 0
      var(--trigger-active-underlineColor);
    color: var(--trigger-active-textColor);
  }
`;

export const tabMixins = {
  tabTriggerStyle,
  tabTriggerUnderlineStyle,
} satisfies Record<string, ReturnType<typeof css>>;
