import React from 'react';

import styled, { css } from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

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

  const { isStakingEnabled } = useEnvFeatures();

  return (
    <Panel
      className={className}
      slotHeaderContent={
        <$Title stakingEnabled={isStakingEnabled}>
          {title} {titleTag && <$Tag>{titleTag}</$Tag>}
        </$Title>
      }
      slotRight={
        <$Arrow>
          <$IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.Small}
          />
        </$Arrow>
      }
      onClick={onNav}
    >
      <$Description>
        {description}
        {learnMore && (
          <$Link href={learnMore} isInline onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {stringGetter({ key: STRING_KEYS.LEARN_MORE_ARROW })}
          </$Link>
        )}
      </$Description>
    </Panel>
  );
};

const $Title = styled.h3<{ stakingEnabled: boolean }>`
  ${layoutMixins.inlineRow}
  font: var(--font-medium-book);

  ${({ stakingEnabled }) =>
    stakingEnabled
      ? css`
          margin-bottom: -1.5rem;
          color: var(--color-text-1);
        `
      : css`
          margin-bottom: -1rem;
          color: var(--color-text-2);
        `}
`;

const $Tag = styled(Tag)`
  color: var(--color-accent);
  background-color: var(--color-accent-faded);
`;

const $Arrow = styled.div`
  padding-right: 1.5rem;
`;

const $IconButton = styled(IconButton)`
  --color-border: var(--color-layer-6);
  color: var(--color-text-0);
`;

const $Description = styled.div`
  color: var(--color-text-0);
`;

const $Link = styled(Link)`
  margin-left: 0.5ch;
`;
