import type { Story } from '@ladle/react';

import { AssetIcon as AssetIconComponent } from '@/components/AssetIcon';

import { StoryWrapper } from '.ladle/components';

export const AssetIcon: Story<{ symbol: string }> = (args) => {
  return (
    <StoryWrapper>
      <AssetIconComponent {...args} />
    </StoryWrapper>
  );
};

AssetIcon.args = {
  symbol: 'ETH',
};
