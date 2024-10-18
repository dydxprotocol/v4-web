import styled from 'styled-components';
import tw from 'twin.macro';

import {
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
  DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD,
  IAffiliateStats,
} from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

interface IShareAffiliateBannerProps {
  accountStats: IAffiliateStats;
}
export const ShareAffiliateBanner = ({ accountStats }: IShareAffiliateBannerProps) => {
  const stringGetter = useStringGetter();

  return (
    <$Container tw="column gap-1">
      <div className="text-medium text-color-text-1">
        {stringGetter({
          key: STRING_KEYS.SHARE_AFFILIATE_BANNER_TITLE,
          params: {
            AMMOUNT: '10.000',
          },
        })}
      </div>
      <div tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.EARCH_FOR_EACH_TRADER_REFER_FOR_DISCOUNTS,
          params: {
            AMOUNT_DISCOUNT: 550,
            VIP_AMOUNT_USD: (
              <span className="text-color-text-1">
                {DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD.toLocaleString()}
              </span>
            ),
            AMOUNT_PER_MONTH: (
              <span className="text-color-text-1">
                {DEFAULT_AFFILIATES_EARN_PER_MONTH_USD.toLocaleString()}
              </span>
            ),
          },
        })}
      </div>
      <$Requirements tw="row justify-between rounded-0.5 px-1 py-0.5">
        <div>
          <div tw="text-small text-color-text-0">
            {stringGetter({
              key: STRING_KEYS.AFFILIATE_LINK_REQUIREMENT,
              params: {
                // TODO: make this configurable or get from API
                AMOUNT_USD: '10K',
              },
            })}
          </div>
          <div>
            {stringGetter({
              key: STRING_KEYS.YOUVE_TRADED,
              params: {
                AMOUNT_USD: accountStats?.referredVolume ?? 0,
              },
            })}
          </div>
        </div>
      </$Requirements>
    </$Container>
  );
};

const $Container = tw.div`rounded-0.625 bg-color-layer-3 p-1`;
const $Requirements = styled.div`
  border: var(--border-width) solid var(--border-color);
`;
