import styled, { css } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';

import { useCopyValue } from '@/hooks/useCopyValue';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button, ButtonProps } from './Button';
import { Icon, IconName } from './Icon';
import { IconButton } from './IconButton';
import { WithTooltip } from './WithTooltip';

export type CopyButtonProps = {
  value?: string;
  buttonType?: 'text' | 'icon' | 'default';
  children?: React.ReactNode;
  onCopy?: () => void;
  copyIconPosition?: 'start' | 'end';
} & ButtonProps;

export const CopyButton = ({
  value,
  buttonType = 'default',
  children,
  onCopy,
  copyIconPosition = buttonType === 'default' ? 'start' : 'end',
  ...buttonProps
}: CopyButtonProps) => {
  const { copied, copy, tooltipString } = useCopyValue({ value, onCopy });

  return buttonType === 'text' ? (
    <$InlineRow onClick={copy} copied={copied}>
      {copyIconPosition === 'start' && (
        <$Icon $copied={copied} iconName={copied ? IconName.Check : IconName.Copy} />
      )}
      {children}
      {copyIconPosition === 'end' && (
        <$Icon $copied={copied} iconName={copied ? IconName.Check : IconName.Copy} />
      )}
    </$InlineRow>
  ) : buttonType === 'icon' ? (
    <WithTooltip tooltipString={tooltipString}>
      <$IconButton
        {...buttonProps}
        copied={copied}
        action={ButtonAction.Base}
        iconName={copied ? IconName.Check : IconName.Copy}
        onClick={copy}
      />
    </WithTooltip>
  ) : (
    <Button
      {...buttonProps}
      action={copied ? ButtonAction.Create : (buttonProps.action ?? ButtonAction.Primary)}
      onClick={copy}
    >
      {copyIconPosition === 'start' && <Icon iconName={copied ? IconName.Check : IconName.Copy} />}
      {children ?? tooltipString}
      {copyIconPosition === 'end' && <Icon iconName={copied ? IconName.Check : IconName.Copy} />}
    </Button>
  );
};

const $InlineRow = styled.div<{ copied: boolean }>`
  ${layoutMixins.inlineRow}
  cursor: pointer;

  ${({ copied }) =>
    copied
      ? css`
          filter: brightness(0.8);
        `
      : css`
          &:hover {
            filter: brightness(var(--hover-filter-base));
            text-decoration: underline;
          }
        `}
`;

const $Icon = styled(Icon)<{ $copied: boolean }>`
  ${({ $copied }) =>
    $copied &&
    css`
      color: var(--color-success);
    `}
`;

const $IconButton = styled(IconButton)<{ copied: boolean }>`
  ${({ copied }) =>
    copied &&
    css`
      svg {
        color: var(--color-success);
      }
    `}
`;
