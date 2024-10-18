import { Dispatch, SetStateAction } from 'react';

import styled from 'styled-components';

import { ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Popover, TriggerType } from '@/components/Popover';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetId } from '@/state/perpetualsSelectors';

import { MarketTypeFilter, PanelView } from './types';

type ElementProps = {
  panelView: PanelView;
  marketTypeFilter: MarketTypeFilter;
  setPanelView: Dispatch<SetStateAction<PanelView>>;
  setMarketTypeFilter: Dispatch<SetStateAction<MarketTypeFilter>>;
  onOpenChange?: (isOpen: boolean) => void;
};

export const TradeTableSettings = ({
  panelView,
  marketTypeFilter,
  setPanelView,
  setMarketTypeFilter,
  onOpenChange,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const currentMarketAssetId = useAppSelector(getCurrentMarketAssetId);

  return (
    <Popover
      align="end"
      sideOffset={4}
      triggerType={TriggerType.TradeTableSettings}
      slotTrigger={<$IconButton iconName={IconName.Settings} shape={ButtonShape.Square} />}
    >
      <$Settings>
        <$Row>
          {stringGetter({ key: STRING_KEYS.VIEW })}
          <ToggleGroup
            withSeparators
            items={[
              {
                value: PanelView.AllMarkets,
                label: stringGetter({ key: STRING_KEYS.ALL }),
              },
              {
                value: PanelView.CurrentMarket,
                ...(currentMarketAssetId
                  ? {
                      slotBefore: <AssetIcon symbol={currentMarketAssetId} tw="text-[1.5em]" />,
                      label: currentMarketAssetId,
                    }
                  : { label: stringGetter({ key: STRING_KEYS.MARKET }) }),
              },
            ]}
            value={panelView}
            onValueChange={setPanelView}
            onInteraction={() => {
              onOpenChange?.(true);
            }}
          />
        </$Row>
        <$Row>
          {stringGetter({ key: STRING_KEYS.TYPE })}{' '}
          <ToggleGroup
            withSeparators
            items={[
              {
                value: MarketTypeFilter.AllMarkets,
                label: stringGetter({ key: STRING_KEYS.ALL }),
              },
              {
                value: MarketTypeFilter.Isolated,
                label: stringGetter({ key: STRING_KEYS.ISOLATED }),
              },
              {
                value: MarketTypeFilter.Cross,
                label: stringGetter({ key: STRING_KEYS.CROSS }),
              },
            ]}
            value={marketTypeFilter}
            onValueChange={(newMarketTypeFilter: string) => {
              setMarketTypeFilter(newMarketTypeFilter as MarketTypeFilter);
            }}
            onInteraction={() => {
              onOpenChange?.(true);
            }}
          />
        </$Row>
      </$Settings>
    </Popover>
  );
};

const $IconButton = styled(IconButton)`
  --button-border: none;
  --button-backgroundColor: transparent;
  --button-icon-size: 1.66em;
  --button-textColor: var(--color-text-0);
`;

const $Settings = styled.div`
  ${popoverMixins.popover}
  --popover-padding: 0.5rem 1rem;
  z-index: 2;
`;

const $Row = styled.div`
  ${layoutMixins.spacedRow}
  color: var(--color-text-0);
  font: var(--font-mini-book);
  gap: 0.75rem;
`;
