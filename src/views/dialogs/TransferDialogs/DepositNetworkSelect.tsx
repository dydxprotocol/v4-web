import styled from 'styled-components';

import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';

import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { SelectItem, SelectMenu, SelectMenuTrigger } from '@/components/SelectMenu';
import { WithLabel } from '@/components/WithLabel';

export const DepositNetworkSelect = ({
  chains,
  selectedChain,
  onSelectChain,
  getAcceptedAssets,
}: {
  chains: Array<string | number>;
  selectedChain: string;
  onSelectChain: (chainId: string) => void;
  getAcceptedAssets: (chainId: string | number) => React.ReactNode;
}) => {
  const stringGetter = useStringGetter();
  const isSimpleUi = useSimpleUiEnabled();

  return (
    <SelectMenu
      fullWidthPopper
      withPortal={isSimpleUi ? false : undefined}
      tw="h-4 w-full text-color-text-2"
      value={selectedChain}
      onValueChange={onSelectChain}
      slotTrigger={
        <SelectMenuTrigger
          css={
            isSimpleUi && {
              '--trigger-open-backgroundColor': 'var(--color-layer-2)',
            }
          }
        >
          <$WithLabel label={stringGetter({ key: STRING_KEYS.NETWORK })}>
            <div tw="w-full">{CHAIN_INFO[selectedChain]?.name}</div>
          </$WithLabel>
          <Icon
            iconName={IconName.Triangle}
            tw="h-0.375 min-h-0.375 w-0.625 min-w-0.625 text-color-text-0"
          />
        </SelectMenuTrigger>
      }
      position="popper"
      side="bottom"
      sideOffset={8}
      contentCss={{
        '--popover-backgroundColor': 'var(--color-layer-2)',
      }}
    >
      {chains.map((id) => (
        <$SelectItem
          key={id}
          value={id.toString()}
          withIcon={false}
          label={
            <div tw="row justify-between gap-0.5">
              <div tw="flexColumn gap-0.25">
                <div>{CHAIN_INFO[id]?.name}</div>
                <div tw="text-color-text-0 font-small-book">{getAcceptedAssets(id)}</div>
              </div>
              <img
                tw="size-1.5 rounded-[50%]"
                src={CHAIN_INFO[id]?.icon}
                alt={CHAIN_INFO[id]?.name}
              />
            </div>
          }
        />
      ))}
    </SelectMenu>
  );
};

const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
  border-radius: 0;

  > * {
    ${layoutMixins.textTruncate}
  }
`;

const $SelectItem = styled(SelectItem)`
  span {
    width: 100%;
  }
`;
