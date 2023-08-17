import { type ChangeEvent, useState } from 'react';
import type { Story } from '@ladle/react';

import {
  WithConfirmationPopover,
  WithConfirmationPopoverProps,
} from '@/components/WithConfirmationPopover';

import { StoryWrapper } from '.ladle/components';
import { Input, InputType } from './Input';

export const WithConfirmationPopoverStory: Story<WithConfirmationPopoverProps> = (args) => {
  const [textValue, setTextValue] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <StoryWrapper>
      <WithConfirmationPopover
        {...args}
        open={open}
        onOpenChange={setOpen}
        onCancel={() => {
          setOpen(false);
          // alert('Cancelled!');
        }}
        onConfirm={() => {
          setOpen(false);
          // alert('Confirmed!');
        }}
        slotTrigger={<div>Trigger</div>}
      >
        <Input
          type={InputType.Text}
          value={textValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTextValue(e.target.value)}
        />
      </WithConfirmationPopover>
    </StoryWrapper>
  );
};

WithConfirmationPopoverStory.args = {
  sideOffset: 8,
};

WithConfirmationPopoverStory.argTypes = {
  align: {
    options: ['end', 'start', 'center'],
    control: { type: 'select' },
    defaultValue: 'end',
  },
};
