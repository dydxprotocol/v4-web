import React from 'react';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';
import { Tag } from '@/components/Tag';

type ElementProps = {
  title: string;
  titleTag?: string;
  description: string;
  learnMore?: string;
  onNav: () => void;
};

type StyleProps = {
  className?: string;
};

export const RewardsNavPanel = ({
  title,
  titleTag,
  description,
  learnMore,
  onNav,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <Panel
      className={className}
      slotHeaderContent={
        <h3 tw="-mb-1.5 text-text-1 font-medium-book inlineRow">
          {title} {titleTag && <Tag tw="bg-accent-faded text-accent">{titleTag}</Tag>}
        </h3>
      }
      slotRight={
        <div tw="pr-1.5">
          <IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.Small}
            tw="text-text-0 [--color-border:var(--color-layer-6)]"
          />
        </div>
      }
      onClick={onNav}
    >
      <div tw="text-text-0">
        {description}
        {learnMore && (
          <Link
            href={learnMore}
            isInline
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            tw="ml-[0.5ch]"
          >
            {stringGetter({ key: STRING_KEYS.LEARN_MORE_ARROW })}
          </Link>
        )}
      </div>
    </Panel>
  );
};
