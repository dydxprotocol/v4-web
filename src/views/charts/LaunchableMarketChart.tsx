import { useState } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';

import { AssetIcon } from '@/components/AssetIcon';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

enum ChartResolution {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export const LaunchableMarketChart = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const [resolution, setResolution] = useState(ChartResolution.DAY);

  const items = [
    {
      key: 'market-cap',
      label: stringGetter({ key: STRING_KEYS.MARKET_CAP }),
      value: <Output type={OutputType.CompactFiat} tw="text-color-text-1" value={1232604.23} />,
    },
    {
      key: 'max-leverage',
      label: stringGetter({ key: STRING_KEYS.MAXIMUM_LEVERAGE }),
      value: <Output type={OutputType.Multiple} value={5} />,
    },
  ];

  return (
    <$LaunchableMarketChartContainer className={className}>
      <$ChartContainerHeader tw="flex flex-row items-center justify-between">
        <div tw="flex flex-row items-center gap-0.5">
          <AssetIcon tw="h-2.5 w-2.5" symbol="ETH" />
          <h2 tw="flex flex-row items-center gap-[0.5ch] text-extra text-color-text-1">
            Ethereum
            <LinkOutIcon tw="h-1.25 w-1.25" />
          </h2>
        </div>

        <Tag>ETH</Tag>
      </$ChartContainerHeader>

      <div tw="flex flex-row justify-between">
        <$Details
          layout="rowColumns"
          items={[
            {
              key: 'reference-price',
              label: stringGetter({ key: STRING_KEYS.REFERENCE_PRICE }),
              tooltip: 'reference-price',
              value: <Output type={OutputType.Fiat} tw="text-color-text-1" value={2604.23} />,
            },
          ]}
        />
        <$ToggleGroup
          size={ButtonSize.Base}
          items={[
            {
              value: ChartResolution.DAY,
              label: `1${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`,
            },
            {
              value: ChartResolution.WEEK,
              label: `7${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`,
            },
            {
              value: ChartResolution.MONTH,
              label: `30${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`,
            },
          ]}
          value={resolution}
          onValueChange={setResolution}
        />
      </div>

      <$ChartContainer />

      <$Details layout="rowColumns" items={items} />
    </$LaunchableMarketChartContainer>
  );
};

const $LaunchableMarketChartContainer = tw.div`flex h-fit w-[25rem] flex-col gap-1 rounded-[1rem] border-[length:--border-width] border-color-border p-1.5 [border-style:solid]`;

const $ChartContainerHeader = tw.div`flex flex-row items-center justify-between`;

const $Details = styled(Details)`
  & > div {
    &:first-of-type {
      padding-left: 0;
    }
  }
`;

const $ToggleGroup = styled(ToggleGroup)`
  button {
    --button-backgroundColor: transparent;
    --button-border: none;

    &[data-state='on'],
    &[data-state='active'] {
      --button-backgroundColor: transparent;
      --button-border: none;
    }

    &:last-of-type {
      padding-right: 0;
    }
  }
` as typeof ToggleGroup;

const $ChartContainer = tw.div`h-[8.75rem] rounded-[1rem] border-[length:--border-width] border-color-border p-1.5 [border-style:solid]`;
