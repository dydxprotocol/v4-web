import { useState } from 'react';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button, ButtonProps } from './Button';
import { Icon, IconName } from './Icon';

export type CopyButtonProps = {
  value?: string;
  shownAsText?: boolean;
  children?: React.ReactNode;
} & ButtonProps;

export const CopyButton = ({ value, shownAsText, children, ...buttonProps }: CopyButtonProps) => {
  const stringGetter = useStringGetter();
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    if (!value) return;

    setCopied(true);
    navigator.clipboard.writeText(value);
    setTimeout(() => setCopied(false), 500);
  };

  return shownAsText ? (
    <Styled.InlineRow onClick={onCopy} copied={copied}>
      {children}
      <Icon iconName={IconName.Copy} />
    </Styled.InlineRow>
  ) : (
    <Button
      {...buttonProps}
      action={copied ? ButtonAction.Create : ButtonAction.Primary}
      onClick={onCopy}
    >
      <Icon iconName={IconName.Copy} />
      {children ?? stringGetter({ key: copied ? STRING_KEYS.COPIED : STRING_KEYS.COPY })}
    </Button>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.InlineRow = styled.div<{ copied: boolean }>`
  ${layoutMixins.inlineRow}
  cursor: pointer;

  ${({ copied }) =>
    copied
      ? css`
          filter: brightness(0.8);
        `
      : css`
          &:hover {
            filter: brightness(1.1);
            text-decoration: underline;
          }
        `}
`;
