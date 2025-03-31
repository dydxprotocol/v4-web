import { BonsaiHelpers } from '@/bonsai/ontology';
import { useNavigate } from 'react-router-dom';

import { AppRoute } from '@/constants/routes';

import { BackButton } from '@/components/BackButton';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { MidMarketPrice } from '@/views/MidMarketPrice';

import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

const AssetHeader = () => {
  const navigate = useNavigate();
  const { marketCap, displayableAsset, percentChange24h, logo } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.marketInfo)
  );
  return (
    <div tw="inlineRow fixed left-0 right-0 top-0 h-[4rem] justify-between gap-[1ch] bg-color-layer-2 pl-0.5 pr-1.25">
      <div tw="inlineRow">
        <BackButton tw="text-color-text-0" onClick={() => navigate(AppRoute.Markets)} />
        <img src={logo} alt={displayableAsset} tw="h-[2.25rem] w-[2.25rem] rounded-[50%]" />
        <div tw="flexColumn gap-0.125">
          <span tw="!leading-[18px] text-color-text-2 font-medium-bold">{displayableAsset}</span>
          <span tw="font-small-regular">
            <Output
              tw="inline"
              type={OutputType.CompactFiat}
              value={marketCap}
              slotRight={<span tw="ml-0.25 text-color-text-0">MC</span>}
            />
          </span>
        </div>
      </div>

      <div tw="flexColumn items-end justify-end gap-0.125">
        <MidMarketPrice tw="font-medium-bold" richColor={false} />
        <Output
          tw="font-small-regular"
          css={{
            color: MustBigNumber(percentChange24h).isZero()
              ? undefined
              : MustBigNumber(percentChange24h).gt(0)
                ? 'var(--color-positive)'
                : 'var(--color-negative)',
          }}
          type={OutputType.Percent}
          showSign={ShowSign.None}
          value={percentChange24h}
        />
      </div>
    </div>
  );
};

export default AssetHeader;
