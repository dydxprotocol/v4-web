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

  &:hover {
    color: var(--trigger-hover-textColor);
  }
`;

const tabTriggerActiveUnderlineStyle = css`
  box-shadow: inset 0 calc(var(--trigger-active-underline-size) * -1) 0
    var(--trigger-active-underlineColor);
  color: var(--trigger-active-textColor);
`;

const tabTriggerUnderlineStyle = css`
  box-shadow: inset 0 calc(var(--trigger-underline-size) * -1) 0 var(--trigger-active-textColor);
  --trigger-active-backgroundColor: var(--trigger-active-underline-backgroundColor);

  &[data-state='active'] {
    ${tabTriggerActiveUnderlineStyle}
  }
`;

export const tabMixins = {
  tabTriggerStyle,
  tabTriggerActiveUnderlineStyle,
  tabTriggerUnderlineStyle,
} satisfies Record<string, ReturnType<typeof css>>;
