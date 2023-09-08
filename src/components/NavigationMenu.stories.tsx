import type { Story } from '@ladle/react';

import { NavigationMenu } from '@/components/NavigationMenu';
import { HashRouter } from 'react-router-dom';

import { StoryWrapper } from '.ladle/components';

export const NavigationMenuStory: Story<Parameters<typeof NavigationMenu>> = (args) => {
  const exampleItems = [
    {
      group: 'navigation',
      groupLabel: 'Views',
      items: [
        {
          value: 'markets',
          label: 'Markets',
          href: './markets',
          subitems: [
            {
              value: 'ETH',
              label: 'Ethereum',
              href: './markets/ETH',
            },
            {
              value: 'BTC',
              label: 'Bitcoin',
              href: './markets/BTC',
            },
          ],
        },
        {
          value: 'trade',
          label: 'Trade',
          href: './trade',
          subitems: [
            {
              value: 'ETH-USD',
              label: 'ETH',
              href: './trade/ETH-USD',
            },
            {
              value: 'BTC-USD',
              label: 'BTC',
              href: './trade/BTC-USD',
            },
          ],
        },
        {
          value: 'portfolio',
          label: 'Portfolio',
          href: './portfolio',
          subitems: [
            {
              value: 'overview',
              label: 'Overview',
              href: './portfolio/overview',
            },
            {
              value: 'positions',
              label: 'Positions',
              href: './portfolio/positions',
            },
            {
              value: 'history',
              label: 'History',
              href: './portfolio/history',
              subitems: [
                {
                  value: 'trades',
                  label: 'Trades',
                  href: './portfolio/overview/trades',
                  subitems: [
                    {
                      value: 'transfers',
                      label: 'Transfers',
                      href: './portfolio/positions/transfers',
                    },
                  ],
                },
                {
                  value: 'transfers',
                  label: 'Transfers',
                  href: './portfolio/positions/transfers',
                },
                {
                  value: 'payments',
                  label: 'Payments',
                  href: './portfolio/history/payments',
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  return (
    <StoryWrapper>
      <HashRouter
        children={
          <NavigationMenu {...args} items={exampleItems}>
            <span>Menu</span>
          </NavigationMenu>
        }
      />
    </StoryWrapper>
  );
};

NavigationMenuStory.args = {};

NavigationMenuStory.argTypes = {
  orientation: {
    options: ['vertical', 'horizontal'],
    control: { type: 'select' },
    defaultValue: 'vertical',
  },
  submenuPlacement: {
    options: ['inline', 'viewport'],
    control: { type: 'select' },
    defaultValue: 'inline',
  },
};
