import styled from 'styled-components';
import tw from 'twin.macro';

import {
  AFFILIATES_REQUIRED_VOLUME_USD,
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
  DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

interface IShareAffiliateBannerProps {
  totalVolume: string;
}
export const ShareAffiliateBanner = ({ totalVolume }: IShareAffiliateBannerProps) => {
  const stringGetter = useStringGetter();

  return (
    <$Container tw="column gap-1">
      <div tw="text-medium text-color-text-1">
        {stringGetter({
          key: STRING_KEYS.SHARE_AFFILIATE_BANNER_TITLE,
          params: {
            AMOUNT: AFFILIATES_REQUIRED_VOLUME_USD.toLocaleString(),
          },
        })}
      </div>
      <div tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.EARN_FOR_EACH_TRADER_REFER_FOR_DISCOUNTS,
          params: {
            AMOUNT_DISCOUNT: 550,
            VIP_AMOUNT_USD: (
              <span tw="text-color-text-1">
                {DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD.toLocaleString()}
              </span>
            ),
            AMOUNT_PER_MONTH: (
              <span tw="text-color-text-1">
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
                AMOUNT_USD: AFFILIATES_REQUIRED_VOLUME_USD.toLocaleString(),
              },
            })}
          </div>
          <div>
            {stringGetter({
              key: STRING_KEYS.YOUVE_TRADED,
              params: {
                AMOUNT_USD: totalVolume,
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
