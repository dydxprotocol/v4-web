import type React from 'react';

export type MenuConfig<
  MenuItemValue extends string | number,
  MenuGroupValue extends string | number,
  MenuItemTypes extends string | number = string | number,
> = MenuGroup<MenuItemValue, MenuGroupValue, MenuItemTypes>[];

export type MenuGroup<
  MenuItemValue extends string | number,
  MenuGroupValue extends string | number,
  MenuItemTypes extends string | number = string | number,
> = {
  group: MenuGroupValue;
  groupLabel?: string;
  items: MenuItem<MenuItemValue, MenuItemTypes>[];
};

export type MenuItem<MenuItemValue, MenuItemTypes = string> = {
  type?: MenuItemTypes;
  value: MenuItemValue;

  slotBefore?: React.ReactNode;
  label: React.ReactNode;
  labelRight?: React.ReactNode;
  tag?: React.ReactNode;
  slotAfter?: React.ReactNode;
  description?: string;
  slotCustomContent?: React.ReactNode;

  href?: string;
  onSelect?: (key: MenuItemValue) => void;
  onClick?: () => void;

  disabled?: boolean;

  subitems?: MenuItem<MenuItemValue, MenuItemTypes>[];
};
