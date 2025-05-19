import { Content, Portal, Root, Trigger } from '@radix-ui/react-popover';

import { forwardRefFn } from '@/lib/genericFunctionalComponentUtils';

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  className?: string;
  withPortal?: boolean;
  withArrow?: boolean;
  withAnimation?: boolean;
};

export const SimpleUiPopover = forwardRefFn(
  ({
    className,
    children,
    content,
    align = 'center',
    side = 'bottom',
    sideOffset = 4,
    withPortal = true,
    withArrow = false,
    withAnimation = true,
  }: StyleProps & {
    children: React.ReactNode;
    content: React.ReactNode;
  }) => {
    const popoverContent = (
      <Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        tw="z-1 overflow-hidden rounded-[0.5rem] border border-solid border-color-border bg-color-layer-4 shadow-md"
        css={{
          ...(withAnimation && {
            animationDuration: '0.2s',
            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            animationFillMode: 'forwards',
            willChange: 'transform, opacity',
            '&[data-state="open"]': {
              '&[data-side="top"]': { animationName: 'slideDownAndFade' },
              '&[data-side="bottom"]': { animationName: 'slideUpAndFade' },
              '&[data-side="left"]': { animationName: 'slideRightAndFade' },
              '&[data-side="right"]': { animationName: 'slideLeftAndFade' },
            },
            '@keyframes slideUpAndFade': {
              '0%': { opacity: 0, transform: 'translateY(4px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            '@keyframes slideDownAndFade': {
              '0%': { opacity: 0, transform: 'translateY(-4px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            '@keyframes slideRightAndFade': {
              '0%': { opacity: 0, transform: 'translateX(-4px)' },
              '100%': { opacity: 1, transform: 'translateX(0)' },
            },
            '@keyframes slideLeftAndFade': {
              '0%': { opacity: 0, transform: 'translateX(4px)' },
              '100%': { opacity: 1, transform: 'translateX(0)' },
            },
          }),
        }}
      >
        {content}
        {withArrow && (
          <div
            tw="absolute h-2 w-4"
            css={{
              fill: 'var(--color-layer-4)',
              stroke: 'var(--color-border)',
              strokeWidth: '1px',
              ...(side === 'top' && {
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
              }),
              ...(side === 'bottom' && {
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%) rotate(180deg)',
              }),
              ...(side === 'left' && {
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%) rotate(270deg)',
              }),
              ...(side === 'right' && {
                left: '-8px',
                top: '50%',
                transform: 'translateY(-50%) rotate(90deg)',
              }),
            }}
          >
            <svg width="16" height="8" viewBox="0 0 16 8">
              <path d="M0 8L8 0L16 8H0Z" />
            </svg>
          </div>
        )}
      </Content>
    );

    const renderedContent = withPortal ? <Portal>{popoverContent}</Portal> : popoverContent;

    return (
      <Root>
        <Trigger className={className} asChild>
          {children}
        </Trigger>
        {renderedContent}
      </Root>
    );
  }
);
