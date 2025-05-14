import { ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { TvChart } from '@/views/charts/TradingView/TvChart';

import { AssetDetails } from './AssetDetails';
import { AssetHeader } from './AssetHeader';
import { AssetPosition } from './AssetPosition';

const AssetPage = () => {
  const stringGetter = useStringGetter();
  const { isViewingUnlaunchedMarket } = useCurrentMarketId();

  const pageContent = isViewingUnlaunchedMarket ? (
    <div>Launch on Desktop</div>
  ) : (
    <>
      <div tw="mb-2 h-[18.75rem] font-small-book">
        <TvChart />
      </div>
      <div tw="flexColumn gap-2 px-1.25 pb-[5.25rem]">
        <AssetPosition />
        <AssetDetails />
      </div>
    </>
  );
  return (
    <div tw="flexColumn h-full">
      <AssetHeader />
      <div tw="mt-[4rem] overflow-auto">{pageContent}</div>
      {!isViewingUnlaunchedMarket && (
        <div
          tw="row fixed bottom-0 left-0 right-0 gap-1.25 px-1.25 py-1.25"
          css={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
          }}
        >
          <Button tw="flex-1 bg-color-negative-dark text-color-negative" shape={ButtonShape.Pill}>
            {stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
          </Button>
          <Button tw="flex-1 bg-color-positive-dark text-color-positive" shape={ButtonShape.Pill}>
            {stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssetPage;
