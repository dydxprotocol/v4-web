import {
  forwardRef,
  type FormEvent,
  type FormEventHandler,
  type MouseEventHandler,
  type ReactElement,
  type Ref,
} from 'react';

import styled, { AnyStyledComponent } from 'styled-components';
import { Anchor, Content, Portal, Root, Trigger } from '@radix-ui/react-popover';

import { ButtonType } from '@/constants/buttons';
import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

type ElementProps = {
  children?: ReactElement;
  asChild?: boolean;
  onCancel?: MouseEventHandler<HTMLAnchorElement> | MouseEventHandler<HTMLButtonElement>;
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
        <Styled.Content
          ref={ref}
          className={className}
          sideOffset={sideOffset}
          align={align}
          onOpenAutoFocus={(e: FocusEvent) => e.preventDefault()}
        >
          <Styled.Form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              e.stopPropagation();

              onConfirm?.(e);
            }}
          >
            {children}
            <Styled.ConfirmationButtons>
              {onCancel && <Styled.CancelButton iconName={IconName.Close} onClick={onCancel} />}
              {onConfirm && (
                <Styled.ConfirmButton iconName={IconName.Check} type={ButtonType.Submit} />
              )}
            </Styled.ConfirmationButtons>
          </Styled.Form>
        </Styled.Content>
      </Portal>
    </Root>
  )
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled(Content)`
  z-index: 1;

  &:focus-visible {
    outline: none;
  }
`;

Styled.Form = styled.form`
  ${layoutMixins.column}
  gap: 0.25rem;
`;

Styled.ConfirmationButtons = styled.div`
  ${layoutMixins.row};

  justify-content: flex-end;
  gap: 0.25rem;
`;

Styled.IconButton = styled(IconButton)`
  --button-height: 1.25rem;
  --button-font: var(--font-tiny-book);
`;

Styled.ConfirmButton = styled(Styled.IconButton)`
  --button-backgroundColor: hsla(203, 25%, 19%, 1);

  svg {
    color: var(--color-positive);
  }
`;

Styled.CancelButton = styled(Styled.IconButton)`
  --button-backgroundColor: hsla(296, 16%, 18%, 1);

  svg {
    color: var(--color-negative);
    width: 0.8em;
    height: 0.8em;

    path {
      stroke-width: 3;
    }
  }
`;
