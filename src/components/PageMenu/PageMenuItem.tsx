import type { MenuItem } from '@/constants/menus';

import { PageMenuNavigationItem } from './PageMenuNavigationItem';
import { PageMenuRadioGroupItem } from './PageMenuRadioGroup';

export enum PageMenuItemType {
  Navigation = 'navigation',
  RadioGroup = 'radioGroup',
}

export const PageMenuItem = <MenuItemValue extends string>({
  type,
  ...props
}: MenuItem<MenuItemValue, PageMenuItemType>) => {
  switch (type) {
    case PageMenuItemType.Navigation:
      return <PageMenuNavigationItem {...props} />;
    case PageMenuItemType.RadioGroup:
      return <PageMenuRadioGroupItem {...props} />;
    default:
      return null;
  }
};
