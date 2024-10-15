import { useToBlob } from '@hugocxl/react-to-image';
import styled from 'styled-components';

import {
  AFFILIATES_FEE_DISCOUNT_USD,
  AFFILIATES_REQUIRED_VOLUME_USD,
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
  DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogProps, ShareAffiliateDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ColorToken } from '@/constants/styles/base';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { QrCode } from '@/components/QrCode';

import { triggerTwitterIntent } from '@/lib/twitter';

const copyBlobToClipboard = async (blob: Blob | null) => {
  if (!blob) {
    return;
  }

  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
};

export const ShareAffiliateDialog = ({ setIsOpen }: DialogProps<ShareAffiliateDialogProps>) => {
  const stringGetter = useStringGetter();
  const { affiliateProgram } = useURLConfigs();
  const { dydxAddress } = useAccounts();
  const {
    affiliateMetadataQuery: { data },
    affiliateMaxEarningQuery: { data: maxEarningData },
  } = useAffiliatesInfo(dydxAddress as string);

  const maxEarning = maxEarningData?.maxEarning;
  const maxVipEarning = maxEarningData?.maxVipEarning;

  const [{ isLoading: isCopying }, , ref] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: copyBlobToClipboard,
  });

  const [{ isLoading: isSharing }, convertShare, refShare] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: async (blob) => {
      await copyBlobToClipboard(blob);

      triggerTwitterIntent({
        text: `${stringGetter({
          key: STRING_KEYS.TWEET_SHARE_AFFILIATES,
          params: {
            AMOUNT_USD: AFFILIATES_FEE_DISCOUNT_USD.toLocaleString(),
          },
        })}\n\n${affiliatesUrl}\n\n#dYdX \n[${stringGetter({ key: STRING_KEYS.TWEET_PASTE_IMAGE_AND_DELETE_THIS })}]`,
        related: 'dYdX',
      });
    },
  });

  const affiliatesUrl = `${window.location.host}?ref=${data?.metadata?.referralCode}`;

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.INVITE_FRIENDS })}
      description={stringGetter({
        key: STRING_KEYS.EARCH_FOR_EACH_TRADER_REFER_FOR_DISCOUNTS,
        params: {
          AMOUNT_DISCOUNT: AFFILIATES_FEE_DISCOUNT_USD.toLocaleString(),
          VIP_AMOUNT_USD:
            maxVipEarning?.toLocaleString() ??
            DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD.toLocaleString(),
          AMOUNT_PER_MONTH:
            maxEarning?.toLocaleString() ?? DEFAULT_AFFILIATES_EARN_PER_MONTH_USD.toLocaleString(),
          LEARN_MORE_LINK: (
            <Link href={affiliateProgram} isInline>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
            </Link>
          ),
        },
      })}
    >
      <div tw="column gap-1">
        <div tw="row justify-between rounded-0.5 bg-color-layer-6 px-1 py-0.5">
          <div>
            <div tw="text-small text-color-text-0">
              {data?.isEligible
                ? stringGetter({ key: STRING_KEYS.AFFILIATE_LINK })
                : stringGetter({
                    key: STRING_KEYS.AFFILIATE_LINK_REQUIREMENT,
                    params: {
                      AMOUNT_USD: AFFILIATES_REQUIRED_VOLUME_USD.toLocaleString(),
                    },
                  })}
            </div>
            <div>
              {data?.isEligible
                ? affiliatesUrl
                : stringGetter({
                    key: STRING_KEYS.YOUVE_TRADED,
                    params: {
                      AMOUNT_USD: data?.totalVolume
                        ? Math.floor(data.totalVolume).toLocaleString()
                        : '0',
                    },
                  })}
            </div>
          </div>
          {data?.isEligible && (
            <CopyButton action={ButtonAction.Primary} size={ButtonSize.Small} value={affiliatesUrl}>
              {stringGetter({ key: STRING_KEYS.COPY_LINK })}
            </CopyButton>
          )}
        </div>
        <div
          ref={(domNode) => {
            if (domNode) {
              ref(domNode);
              refShare(domNode);
            }
          }}
          tw="relative"
        >
          <img src="/affiliates-share.png" alt="share affiliates" tw="w-full rounded-1" />
          <$QrCode
            size={68}
            options={{
              margin: 0,
              backgroundOptions: {
                color: ColorToken.White,
              },
              dotsOptions: {
                type: 'dots',
                color: ColorToken.DarkGray13,
              },
              cornersSquareOptions: {
                type: 'extra-rounded',
                color: ColorToken.DarkGray13,
              },
              imageOptions: {
                margin: 0,
              },
            }}
            value={affiliatesUrl}
          />
        </div>

        <div tw="flex gap-1">
          <Button
            action={data?.isEligible ? ButtonAction.Base : ButtonAction.Primary}
            slotLeft={<Icon iconName={IconName.Rocket} />}
            state={{
              isLoading: isCopying,
            }}
            tw="flex-1"
            href={affiliateProgram}
          >
            {stringGetter({ key: STRING_KEYS.BECOME_A_VIP })}
          </Button>
          {data?.isEligible && (
            <Button
              action={ButtonAction.Base}
              slotLeft={<Icon iconName={IconName.SocialX} />}
              onClick={() => {
                convertShare();
              }}
              state={{
                isLoading: isSharing,
              }}
              tw="flex-1 flex-grow-0 px-2"
            >
              {stringGetter({ key: STRING_KEYS.SHARE })}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

const $QrCode = styled(QrCode)`
  width: 7rem;
  height: 7rem;
  position: absolute;

  top: 1.5rem;
  right: 1.5rem;

  svg {
    border: none;
  }
`;
