import { forwardRef, Ref, useEffect, useRef, useState } from 'react';
import styled, { type AnyStyledComponent, css, keyframes } from 'styled-components';
import { NavLink, matchPath, useLocation } from 'react-router-dom';

import { MenuConfig, MenuItem } from '@/constants/menus';

import { isExternalLink } from '@/lib/isExternalLink';

import { popoverMixins } from '@/styles/popoverMixins';

import {
  Root,
  List,
  Trigger,
  Content,
  Item,
  Link,
  Sub,
  Viewport,
} from '@radix-ui/react-navigation-menu';

import { layoutMixins } from '@/styles/layoutMixins';

import { isTruthy } from '@/lib/isTruthy';

import { Tag } from './Tag';
import { Icon, IconName } from './Icon';

type ElementProps<MenuItemValue extends string, MenuGroupValue extends string> = {
  items: MenuConfig<MenuItemValue, MenuGroupValue>;
  onSelectItem?: (value: MenuItemValue) => void;
  onSelectGroup?: (value: MenuGroupValue) => void;
};

type StyleProps = {
  orientation?: 'vertical' | 'horizontal';
  itemOrientation?: 'vertical' | 'horizontal';
  submenuPlacement?: 'inline' | 'viewport';
  dir?: 'ltr' | 'rtl';
  className?: string;
};

const NavItem = forwardRef(
  <MenuItemValue extends string>(
    {
      value,
      slotBefore,
      label,
      tag,
      href,
      slotAfter = isExternalLink(href) ? <Icon iconName={IconName.LinkOut} /> : undefined,
      onSelect,
      subitems,
      ...props
    }: MenuItem<MenuItemValue>,
    ref: Ref<HTMLAnchorElement> | Ref<HTMLDivElement> | Ref<HTMLButtonElement>
  ) => {
    const location = useLocation();

    const children = (
      <>
        {slotBefore}
        <span>
          {/* {`${label}${subitems?.length ? ' ' : ''}`} */}
          {label}
          {tag && (
            <>
              {' '}
              <Tag>{tag}</Tag>
            </>
          )}
        </span>
        {slotAfter}
        {subitems?.length && <Styled.Icon iconName={IconName.Triangle} />}
      </>
    );

    return href ? (
      <Link
        active={!!matchPath(href, location.pathname)}
        onSelect={() => onSelect?.(value)}
        asChild
        target={isExternalLink(href) ? '_blank' : undefined}
      >
        <NavLink to={href} ref={ref as Ref<HTMLAnchorElement>} {...props}>
          {children}
        </NavLink>
      </Link>
    ) : props.onClick ? (
      <Link asChild onSelect={() => onSelect?.(value)}>
        <button ref={ref as Ref<HTMLButtonElement>} {...props} type="button">
          {children}
        </button>
      </Link>
    ) : (
      <div ref={ref as Ref<HTMLDivElement>} {...props}>
        {children}
      </div>
    );
  }
);

type TriggerRef = HTMLAnchorElement | HTMLDivElement | HTMLButtonElement | null;

export const NavigationMenu = <MenuItemValue extends string, MenuGroupValue extends string>({
  onSelectItem,
  onSelectGroup,
  items,
  orientation = 'vertical',
  itemOrientation = 'horizontal',
  submenuPlacement = 'inline', // orientation === 'horizontal' ? 'viewport' : 'inline',
  dir = 'ltr',
  className,
}: ElementProps<MenuItemValue, MenuGroupValue> & StyleProps) => {
  // Disable click (close) in the first 500ms after hover (open)
  // https://github.com/radix-ui/primitives/issues/1630#issuecomment-1545995075
  const [clickIsDisabled, setClickIsDisabled] = useState(false);
  const triggerRefs = useRef({} as { [value: string]: TriggerRef });

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-state' &&
          (mutation.target as unknown as HTMLOrSVGElement).dataset.state === 'open' &&
          mutation.target !== document.activeElement
        ) {
          setClickIsDisabled(true);
          setTimeout(() => setClickIsDisabled(false), 500);
        }
      }
    });

    for (const element of Object.values(triggerRefs.current).filter(isTruthy)) {
      observer.observe(element, { attributes: true });
    }

    return () => observer.disconnect();
  }, []);

  const renderSubitems = ({
    item,
    depth = 0,
  }: {
    item: MenuItem<MenuItemValue, string | number>;
    depth: number;
  }) => (
    <>
      <Styled.SubMenuTrigger
        asChild={depth > 0}
        ref={(ref: TriggerRef) => (triggerRefs.current[item.value] = ref)}
        onClick={(e: MouseEvent) => {
          if (clickIsDisabled) {
            e.preventDefault();
          }
        }}
      >
        <Styled.NavItem onSelect={onSelectGroup} orientation={itemOrientation} {...item} />
      </Styled.SubMenuTrigger>

      <Styled.Content data-placement={submenuPlacement}>
        <Styled.Sub data-placement={submenuPlacement}>
          <Styled.List
            data-orientation={depth > 0 ? 'menu' : orientation === 'vertical' ? 'vertical' : 'menu'}
          >
            {item?.subitems?.map((subitem) => (
              <Styled.ListItem key={subitem.value} value={subitem.value} data-item={subitem.value}>
                {subitem?.subitems ? (
                  renderSubitems({ item: subitem, depth: depth + 1 })
                ) : (
                  <Styled.NavItem
                    onSelect={onSelectItem}
                    orientation={itemOrientation}
                    {...subitem}
                  />
                )}
              </Styled.ListItem>
            ))}
          </Styled.List>
        </Styled.Sub>
      </Styled.Content>
    </>
  );

  return (
    <Styled.Root orientation={orientation} dir={dir} className={className}>
      {items.map((group) => (
        <Styled.Group key={group.group}>
          {group.groupLabel && (
            <Styled.GroupHeader>
              <h3>{group.groupLabel}</h3>
            </Styled.GroupHeader>
          )}

          <Styled.List data-orientation={orientation}>
            {group.items.map((item) => (
              <Styled.ListItem key={item.value} value={item.value} data-item={item.value}>
                {item.subitems ? (
                  renderSubitems({ item, depth: 0 })
                ) : (
                  <Styled.NavItem onSelect={onSelectItem} orientation={itemOrientation} {...item} />
                )}
              </Styled.ListItem>
            ))}
          </Styled.List>
        </Styled.Group>
      ))}

      {submenuPlacement === 'viewport' && <Styled.Viewport data-orientation={orientation} />}
    </Styled.Root>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Root = styled(Root)`
  /* Params */
  --navigationMenu-height: auto;

  --navigationMenu-item-height: 2rem;

  --navigationMenu-item-checked-backgroundColor: var(--color-layer-1);
  --navigationMenu-item-checked-textColor: var(--color-text-2);
  --navigationMenu-item-highlighted-backgroundColor: var(--color-layer-4);
  --navigationMenu-item-highlighted-textColor: var(--color-text-2);
  --navigationMenu-item-radius: 0.5rem;
  --navigationMenu-item-padding: 0.5rem 1rem;

  /* Rules */
  align-self: stretch;

  --submenu-side-offset: 0.75rem; // placement="viewport"
  // --submenu-side-offset: 1rem; // placement="inline"

  position: relative;

  &[data-orientation='horizontal'] {
    ${layoutMixins.row}
    align-items: stretch;

    margin: calc((var(--navigationMenu-height) - var(--navigationMenu-item-height)) / 2) 0;
    height: max-content;
  }
  &[data-orientation='vertical'] {
    ${layoutMixins.column}
  }

  div[style='position: relative;'] {
    display: grid;
  }
`;

Styled.Viewport = styled(Viewport)`
  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
  --popover-origin: center top;

  ${layoutMixins.stack}
  align-content: start;
  justify-items: center;

  width: var(--radix-navigation-menu-viewport-width);
  height: var(--radix-navigation-menu-viewport-height);
  max-height: var(--radix-navigation-menu-viewport-height);
  transition: 0.3s;
  box-sizing: content-box;

  position: absolute;

  &[data-orientation='horizontal'] {
    top: calc(100% + var(--submenu-side-offset));
    left: 0;
    right: 0;
    margin: auto;
    display: grid;
    justify-content: center;

    z-index: 2;
  }

  &[data-orientation='vertical'] {
    left: 100%;
    /* top: 100%; */
  }
`;

Styled.Content = styled(Content)`
  ${popoverMixins.popoverAnimation}
  transform-origin: center top;

  &[data-placement='inline'] {
    max-height: 100vh;

    ${Styled.List}[data-orientation="horizontal"] & {
      /* position: absolute;
      top: calc(100% + var(--submenu-side-offset));
      left: 50%;
      right: 50%; */

      position: relative;
      width: 0;
      left: 50%;
      right: 50%;

      display: grid;
      justify-content: center;

      z-index: 2;
    }

    ${Styled.List}[data-orientation="menu"] & {
      position: absolute;
      left: 100%;
      top: 0;
      right: auto;
      display: grid;
      justify-content: start;
    }
  }

  &[data-placement='viewport'] {
    position: absolute;

    &[data-motion='from-start'] {
      animation: ${keyframes`
        from {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
    &[data-motion='from-end'] {
      animation: ${keyframes`
        from {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
    &[data-motion='to-start'] {
      animation: ${keyframes`
        to {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
    &[data-motion='to-end'] {
      animation: ${keyframes`
        to {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
  }
`;

Styled.Sub = styled(Sub)`
  &[data-placement='inline'] {
    ${popoverMixins.popover}
    --popover-width: max-content;
    overflow: visible;

    ${Styled.List}[data-orientation="vertical"] > & {
      margin-top: var(--gap, 0.25rem);

      padding: 0.5rem;
    }

    ${Styled.List}[data-orientation="menu"] & {
      border-top-left-radius: 0 !important;
    }
  }
`;

Styled.Group = styled.section`
  ${Styled.Root}[data-orientation="vertical"] & {
    ${layoutMixins.stickyArea0}
    --stickyArea0-topHeight: 3rem;
  }

  ${layoutMixins.column}

  color: var(--color-text-0);
`;

Styled.GroupHeader = styled.header`
  ${layoutMixins.stickyHeader}
  ${layoutMixins.row}

  padding: 0.5rem 0.75rem 0rem;
  font: var(--font-small-medium);
`;

Styled.List = styled(List)`
  align-self: center;

  &[data-orientation='horizontal'] {
    ${layoutMixins.row}
    gap: 0.5rem;
    align-items: start;
  }

  &[data-orientation='vertical'] {
    ${layoutMixins.flexColumn}
    gap: 0.25rem;
  }
`;

Styled.ListItem = styled(Item)`
  /* display: contents; */
  display: grid;
  position: relative;

  ${Styled.List}[data-orientation="horizontal"] > & {
    gap: var(--submenu-side-offset);
  }

  /* ${Styled.List}[data-orientation="menu"] > & {
    grid-template-columns: 1fr 0;
    align-items: start;
    gap: 2rem;
  } */

  /* &:has([data-state="open"]) {
    position: sticky;
    left: 0;
    right: 0;
  } */
`;

Styled.SubMenuTrigger = styled(Trigger)`
  border-radius: var(--navigationMenu-item-radius);
  outline-offset: -2px;

  &[data-state='open'] {
    div {
      background-color: var(--navigationMenu-item-checked-backgroundColor);
      color: var(--navigationMenu-item-checked-textColor);
    }

    svg {
      rotate: 0.5turn;
    }
  }
`;

Styled.NavItem = styled(NavItem)<{ orientation: 'horizontal' | 'vertical' }>`
  ${({ subitems }) =>
    subitems?.length
      ? css`
          ${popoverMixins.trigger}
          --trigger-backgroundColor: transparent;
          --trigger-open-backgroundColor: var(--color-layer-3);
        `
      : css`
          &:hover:not(.active) {
            background-color: var(--navigationMenu-item-highlighted-backgroundColor);
            color: var(--navigationMenu-item-highlighted-textColor);
          }
        `}

  ${popoverMixins.item}
  --item-checked-backgroundColor: var(--navigationMenu-item-checked-backgroundColor);
  --item-checked-textColor: var(--navigationMenu-item-checked-textColor);
  --item-highlighted-backgroundColor: var(--navigationMenu-item-highlighted-backgroundColor);
  --item-highlighted-textColor: var(--navigationMenu-item-highlighted-textColor);
  --item-radius: var(--navigationMenu-item-radius);
  --item-padding: var(--navigationMenu-item-padding);

  /* ${popoverMixins.backdropOverlay} */

  ${layoutMixins.scrollSnapItem}

  min-height: var(--navigationMenu-item-height);

  ${({ orientation }) =>
    ({
      horizontal: css`
        ${layoutMixins.row}
      `,
      vertical: css`
        ${layoutMixins.column}
        justify-items: center;
        align-content: center;
      `,
    }[orientation])}
  gap: 0.7rem 0.5rem;

  > span {
    flex: 1;

    display: inline-flex;
    align-items: center;
    gap: 0.5ch;
  }

  /* Border-radius! */

  ${Styled.List}[data-orientation="menu"] & {
    --item-radius: 0;
  }

  ${Styled.List}[data-orientation="menu"] > ${Styled.ListItem}:first-child > & {
    border-top-left-radius: var(--popover-radius);

    &:not([data-state='open']) {
      border-top-right-radius: var(--popover-radius);
    }
  }

  ${Styled.List}[data-orientation="menu"] > ${Styled.ListItem}:last-child > & {
    border-bottom-left-radius: var(--popover-radius);

    &:not([data-state='open']) {
      border-bottom-right-radius: var(--popover-radius);
    }
  }

  ${Styled.List}[data-orientation="menu"] ${Styled.List}[data-orientation="menu"] > ${Styled.ListItem}:first-child > & {
    border-top-left-radius: 0;
  }
`;

Styled.Icon = styled(Icon)`
  font-size: 0.375em;
  transition: rotate 0.3s var(--ease-out-expo);

  ${Styled.List}[data-orientation="menu"] & {
    rotate: -0.25turn;
  }
`;
