import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { DialogTypes } from '@/constants/dialogs';
import { useStringGetter, useTokenConfigs, useURLConfigs } from '@/hooks';

import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';
import { Tag } from '@/components/Tag';

import { openDialog } from '@/state/dialogs';

export const StrideStakingPanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { stakingLearnMore } = useURLConfigs();
  const { chainTokenLabel } = useTokenConfigs();

  return (
    <Panel
      className={className}
      slotHeaderContent={
        <Styled.Title>
          Liquid Stake with Stride <Tag>{stringGetter({ key: STRING_KEYS.NEW })}</Tag>
        </Styled.Title>
      }
      slotRight={<Styled.Img src="/third-party/stride.png" alt="" />}
      onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavStride }))}
    >
      <Styled.Description>
        {`Stake your ${chainTokenLabel} tokens for st${chainTokenLabel} which you can deploy around the ecosystem.`}
        <Link href={stakingLearnMore} onClick={(e) => e.stopPropagation()}>
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
        </Link>
      </Styled.Description>
    </Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  margin-bottom: -1rem;

  display: flex;
  align-items: center;
  gap: 0.5ch;
`;

Styled.Img = styled.img`
  width: 2rem;
  height: 2rem;
  margin-right: 1.5rem;
`;

Styled.Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    ::before {
      content: ' ';
    }
  }
`;

Styled.IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;
