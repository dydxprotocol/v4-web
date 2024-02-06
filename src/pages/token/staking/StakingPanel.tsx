import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { DialogTypes } from '@/constants/dialogs';

import { useStringGetter, useURLConfigs } from '@/hooks';

import { Panel } from '@/components/Panel';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';

import { openDialog } from '@/state/dialogs';

export const StakingPanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { stakingLearnMore } = useURLConfigs();

  return (
    <Panel
      className={className}
      slotHeaderContent={<Styled.Title>Stake with Keplr</Styled.Title>}
      slotRight={
        <Styled.Img
          src="/wallets/keplr.png"
          alt={stringGetter({ key: STRING_KEYS.KEPLR_WALLET })}
        />
      }
      onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
    >
      <Styled.Description>
        {stringGetter({ key: STRING_KEYS.STAKING_DESCRIPTION })}
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
