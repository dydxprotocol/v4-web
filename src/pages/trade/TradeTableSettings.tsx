import { Dispatch, SetStateAction } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Popover, TriggerType } from '@/components/Popover';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppSelector } from '@/state/appTypes';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';

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
  const currentMarketAssetId = useAppSelector(BonsaiHelpers.currentMarket.assetId);
  const imageUrl = useAppSelector(BonsaiHelpers.currentMarket.assetLogo);
  const symbol = getDisplayableAssetFromBaseAsset(currentMarketAssetId);

  return (
    <Popover
      align="end"
      sideOffset={4}
      triggerType={TriggerType.TradeTableSettings}
      slotTrigger={
        <div tw="flex h-[1.75rem] items-center gap-[0.5ch] px-0.5 font-mini-book">
          {stringGetter({
            key: STRING_KEYS.SHOWING,
            params: {
              ALL_OR_MARKET: (
                <span tw="text-color-text-2">
                  {panelView === PanelView.CurrentMarket
                    ? symbol
                    : stringGetter({ key: STRING_KEYS.ALL })}
                </span>
              ),
            },
          })}
          <Icon iconName={IconName.Settings} size="1.5em" />
        </div>
      }
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
                ...(symbol
                  ? {
                      slotBefore: (
                        <AssetIcon logoUrl={imageUrl} symbol={symbol} tw="text-[1.5em]" />
                      ),
                      label: symbol,
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
          {stringGetter({ key: STRING_KEYS.TYPE })}
          <ToggleGroup
            withSeparators
            items={[
              {
                value: MarketTypeFilter.AllMarkets,
                label: stringGetter({ key: STRING_KEYS.ALL }),
              },
              {
                value: MarketTypeFilter.Cross,
                label: stringGetter({ key: STRING_KEYS.CROSS }),
              },
              {
                value: MarketTypeFilter.Isolated,
                label: stringGetter({ key: STRING_KEYS.ISOLATED }),
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
