import type { Story } from '@ladle/react';

import { PositionSide } from '@/constants/trade';

import { PositionSideTag } from '@/components/PositionSideTag';

import { StoryWrapper } from '.ladle/components';

export const LongTagStory: Story<{ positionSide: PositionSide }> = (args) => {
  return (
    <StoryWrapper>
      <PositionSideTag positionSide={args.positionSide} />
    </StoryWrapper>
  );
};

LongTagStory.args = {
  positionSide: PositionSide.Long,
};

export const ShortTagStory: Story<{ positionSide: PositionSide }> = (args) => {
  return (
    <StoryWrapper>
      <PositionSideTag positionSide={args.positionSide} />
    </StoryWrapper>
  );
};

ShortTagStory.args = {
  positionSide: PositionSide.Short,
};

export const NoneTagStory: Story<{ positionSide: PositionSide }> = (args) => {
  return (
    <StoryWrapper>
      <PositionSideTag positionSide={args.positionSide} />
    </StoryWrapper>
  );
};

NoneTagStory.args = {
  positionSide: PositionSide.None,
};
