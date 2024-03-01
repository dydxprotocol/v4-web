import { useDispatch } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

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
    <Styled.Panel
      className={className}
      slotHeaderContent={
        <Styled.Header>
          <Styled.Title>
            {stringGetter({ key: STRING_KEYS.LIQUID_STAKE_W_STRIDE })}
            <Tag isHighlighted>{stringGetter({ key: STRING_KEYS.NEW })}</Tag>
          </Styled.Title>
          <Styled.Img src="/third-party/stride.png" alt="Stride" />
        </Styled.Header>
      }
      onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavStride }))}
    >
      <Styled.Description>
        {stringGetter({
          key: STRING_KEYS.LIQUID_STAKE_STRIDE_DESCRIPTION,
          params: { TOKEN_DENOM: chainTokenLabel },
        })}
        <Link href={stakingLearnMore} onClick={(e) => e.stopPropagation()}>
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
        </Link>
      </Styled.Description>
    </Styled.Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Panel = styled(Panel)`
  align-items: start;

  header {
    justify-content: unset;
    padding-bottom: 0;
  }
`;

Styled.Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

Styled.Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);

  display: flex;
  align-items: center;
  gap: 0.5ch;
`;

Styled.Img = styled.img`
  width: 2rem;
  height: 2rem;
  margin-left: 0.5rem;
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
