import { MemoryRouter } from 'react-router-dom';
import type { Story } from '@ladle/react';

import type { MenuGroup } from '@/constants/menus';

import { PageMenu } from '@/components/PageMenu';
import { PageMenuItemType } from './PageMenu/PageMenuItem';

import { StoryWrapper } from '.ladle/components';

export const PageMenuStory: Story<MenuGroup<string, string, PageMenuItemType>> = (args) => {
  return (
    <StoryWrapper>
      <PageMenu {...args} />
    </StoryWrapper>
  );
};

PageMenuStory.args = {
  group: 'story',
  items: [
    {
      value: 'language-nav-item',
      type: PageMenuItemType.Navigation,
      href: '',
      label: 'Language',
      labelRight: 'English',
    },
    {
      value: 'notification-nav-item',
      type: PageMenuItemType.Navigation,
      href: '',
      label: 'Notifications',
    },
    {
      value: 'network-nav-item',
      type: PageMenuItemType.Navigation,
      href: '',
      label: 'Network',
    },
    {
      type: PageMenuItemType.RadioGroup,
      value: 'english',
      label: 'Language',
      subitems: [
        {
          value: 'english',
          label: 'English',
        },
        {
          value: 'spanish',
          label: 'Spanish',
        },
      ],
    },
  ],
};

PageMenuStory.decorators = [
  (Story) => (
    <MemoryRouter initialEntries={['/']}>
      <Story />
    </MemoryRouter>
  ),
];
