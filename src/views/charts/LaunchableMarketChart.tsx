import { useState } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useMetadataServiceAssetFromId } from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';

import { Details } from '@/components/Details';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { orEmptyObj } from '@/lib/typeUtils';

enum ChartResolution {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export const LaunchableMarketChart = ({
  className,
  ticker,
}: {
  className?: string;
  ticker?: string;
}) => {
  const stringGetter = useStringGetter();
  const [resolution, setResolution] = useState(ChartResolution.DAY);
  const launchableAsset = useMetadataServiceAssetFromId(ticker);
  const { id, marketCap, name, price, logo, tickSizeDecimals, urls } = orEmptyObj(launchableAsset);
  const websiteLink = urls?.website ?? undefined;

  if (!ticker) return null;

  const items = [
    {
      key: 'market-cap',
      label: stringGetter({ key: STRING_KEYS.MARKET_CAP }),
      value: <Output type={OutputType.CompactFiat} tw="text-color-text-1" value={marketCap} />,
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
        <div tw="mr-0.5 flex flex-row items-center gap-0.5">
          <img tw="h-2.5 w-2.5 rounded-[50%]" src={logo} alt={name} />
          <h2 tw="flex flex-row items-center gap-[0.5ch] text-extra text-color-text-1">
            <Link href={websiteLink}>
              <span>{name}</span>
              <LinkOutIcon tw="h-1.25 w-1.25" />
            </Link>
          </h2>
        </div>

        {id && <Tag>{getDisplayableAssetFromBaseAsset(id)}</Tag>}
      </$ChartContainerHeader>

      <div tw="flex flex-row justify-between">
        <$Details
          layout="rowColumns"
          items={[
            {
              key: 'reference-price',
              label: stringGetter({ key: STRING_KEYS.REFERENCE_PRICE }),
              tooltip: 'reference-price',
              value: (
                <Output
                  type={OutputType.Fiat}
                  tw="text-color-text-1"
                  value={price}
                  fractionDigits={tickSizeDecimals}
                />
              ),
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
