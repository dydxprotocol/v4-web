import type { Story } from '@ladle/react';

import { AlertType } from '@/constants/alerts';

import {
  AlertMessage as AlertMessageComponent,
  AlertMessageProps,
} from '@/components/AlertMessage';

import { StoryWrapper } from '.ladle/components';

export const AlertMessage: Story<AlertMessageProps> = (args) => {
  return (
    <StoryWrapper>
      <AlertMessageComponent {...args} />
    </StoryWrapper>
  );
};

AlertMessage.args = {
  children: 'This is an alert message',
};

AlertMessage.argTypes = {
  type: {
    options: Object.values(AlertType),
    control: { type: 'select' },
    defaultValue: AlertType.Success,
  },
};
