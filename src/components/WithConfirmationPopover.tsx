import {
  forwardRef,
  type FormEvent,
  type FormEventHandler,
  type ReactElement,
  type Ref,
} from 'react';

import { Anchor, Content, Portal, Root, Trigger } from '@radix-ui/react-popover';
import styled from 'styled-components';

import { ButtonType } from '@/constants/buttons';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

type ElementProps = {
  children?: ReactElement;
  asChild?: boolean;
  onCancel?: () => void;
  onConfirm?: FormEventHandler;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  slotTrigger: ReactElement;
};

type StyleProps = {
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};

export type WithConfirmationPopoverProps = ElementProps & StyleProps;

export const WithConfirmationPopover = forwardRef(
  (
    {
      children,
      className,
      onCancel,
      onConfirm,

      asChild,
      open,
      onOpenChange,
      align,
      sideOffset,
      slotTrigger,
    }: WithConfirmationPopoverProps,
    ref?: Ref<HTMLDivElement>
  ) => (
    <Root open={open} onOpenChange={onOpenChange}>
      <Trigger asChild={asChild} onClick={(e) => asChild && e.preventDefault()}>
        <Anchor>{slotTrigger}</Anchor>
      </Trigger>

      <Portal>
        <$Content
          ref={ref}
          className={className}
          sideOffset={sideOffset}
          align={align}
          onOpenAutoFocus={(e: Event) => e.preventDefault()}
        >
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              e.stopPropagation();

              onConfirm?.(e);
            }}
            tw="column gap-0.25"
          >
            {children}
            <div tw="row justify-end gap-0.25">
              {onCancel && (
                <$CancelButton iconName={IconName.Close} onClick={onCancel} iconSize="0.8em" />
              )}
              {onConfirm && <$ConfirmButton iconName={IconName.Check} type={ButtonType.Submit} />}
            </div>
          </form>
        </$Content>
      </Portal>
    </Root>
  )
);
const $Content = styled(Content)`
  z-index: 1;

  &:focus-visible {
    outline: none;
  }
`;
const $IconButton = styled(IconButton)`
  --button-height: 1.25rem;
  --button-font: var(--font-tiny-book);
`;

const $ConfirmButton = styled($IconButton)`
  --button-backgroundColor: hsla(203, 25%, 19%, 1);

  svg {
    color: var(--color-green);
  }
`;

const $CancelButton = styled($IconButton)`
  --button-backgroundColor: hsla(296, 16%, 18%, 1);

  svg {
    color: var(--color-red);

    path {
      stroke-width: 3;
    }
  }
`;
