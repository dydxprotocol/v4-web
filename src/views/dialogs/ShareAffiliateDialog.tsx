import { useCallback, useEffect, useRef, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { getFontEmbedCSS, toPng } from 'html-to-image';
import styled from 'styled-components';

import {
  AFFILIATES_FEE_DISCOUNT_USD,
  AFFILIATES_REQUIRED_VOLUME_USD,
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
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

import { track } from '@/lib/analytics/analytics';
import { triggerTwitterIntent } from '@/lib/twitter';

import { AffiliateProgress } from '../Affiliates/AffiliateProgress';
import { OnboardingTriggerButton } from './OnboardingTriggerButton';

export const ShareAffiliateDialog = ({ setIsOpen }: DialogProps<ShareAffiliateDialogProps>) => {
  const stringGetter = useStringGetter();
  const { affiliateProgramFaq, affiliateProgram } = useURLConfigs();
  const { dydxAddress } = useAccounts();
  const {
    affiliateMetadataQuery: { data },
    affiliateMaxEarningQuery: { data: maxEarningData },
  } = useAffiliatesInfo(dydxAddress);

  useEffect(() => {
    if (data?.isEligible === undefined) return;

    track(
      AnalyticsEvents.AffiliateInviteFriendsModalOpened({ isAffiliateEligible: data.isEligible })
    );
  }, [data?.isEligible]);

  const maxEarning = maxEarningData?.maxEarning;

  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const affiliateCardRef = useRef<HTMLDivElement>(null);

  const affiliatesUrl =
    data?.metadata?.referralCode && `${window.location.host}?ref=${data.metadata.referralCode}`;

  const onCopy = useCallback(async () => {
    if (affiliateCardRef.current == null) {
      return;
    }

    try {
      setIsCopying(true);
      const fontEmbedCss = await getFontEmbedCSS(affiliateCardRef.current);

      const dataUrl = await toPng(affiliateCardRef.current, {
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: fontEmbedCss,
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': dataUrl })]);
    } catch (error) {
      logBonsaiError('ShareAffiliateDialog', 'onCopy', { error });
    } finally {
      setIsCopying(false);
    }
  }, [affiliateCardRef]);

  const onCopyAndShare = useCallback(async () => {
    setIsSharing(true);
    await onCopy();

    triggerTwitterIntent({
      text: `${stringGetter({
        key: STRING_KEYS.TWEET_SHARE_AFFILIATES,
        params: {
          AMOUNT_USD: AFFILIATES_FEE_DISCOUNT_USD.toLocaleString(),
        },
      })}\n\n${affiliatesUrl}\n\n#dYdX \n[${stringGetter({ key: STRING_KEYS.TWEET_PASTE_IMAGE_AND_DELETE_THIS })}]`,
      related: 'dYdX',
    });

    setIsSharing(false);
  }, [affiliatesUrl, onCopy, stringGetter]);

  const dialogDescription = (
    <span>
      {!data?.isEligible
        ? stringGetter({
            key: STRING_KEYS.AFFILIATE_PROGRAM_TRADING_REQUIREMENT,
            params: {
              AMOUNT_USD: AFFILIATES_REQUIRED_VOLUME_USD.toLocaleString(),
            },
          })
        : stringGetter({
            key: STRING_KEYS.EARN_FOR_EACH_TRADER,
            params: {
              AMOUNT_USD:
                maxEarning?.toLocaleString() ??
                DEFAULT_AFFILIATES_EARN_PER_MONTH_USD.toLocaleString(),
            },
          })}{' '}
      <Link href={affiliateProgramFaq} isInline>
        {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
      </Link>
    </span>
  );

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.UNLOCK_AFFILIATE_PROGRAM })}
      description={dialogDescription}
    >
      {!dydxAddress && (
        <OnboardingTriggerButton
          tw="w-full"
          size={ButtonSize.Medium}
          onClick={() => {
            setIsOpen(false);
          }}
        />
      )}
      {dydxAddress && !data?.isEligible && <AffiliateProgress volume={data?.totalVolume} />}
      {dydxAddress && data?.isEligible && (
        <div tw="column gap-1">
          <div tw="row justify-between rounded-0.5 bg-color-layer-6 px-1 py-0.5">
            <div>
              <div tw="text-small text-color-text-0">
                {stringGetter({ key: STRING_KEYS.AFFILIATE_LINK })}
              </div>
              <div>{affiliatesUrl}</div>
            </div>
            {affiliatesUrl && (
              <CopyButton
                action={ButtonAction.Primary}
                size={ButtonSize.Small}
                value={affiliatesUrl}
                onCopy={() => {
                  track(AnalyticsEvents.AffiliateURLCopied({ url: affiliatesUrl }));
                }}
              >
                {stringGetter({ key: STRING_KEYS.COPY_LINK })}
              </CopyButton>
            )}
          </div>
          {affiliatesUrl && (
            <div ref={affiliateCardRef} tw="relative">
              <img src="/affiliates-share.png" alt="share affiliates" tw="w-full rounded-1" />
              <$QrCode
                tw="rounded-0.75 bg-white p-0.5"
                size={68}
                value={affiliatesUrl}
                options={{
                  cells: {
                    fill: ColorToken.DarkGray13,
                  },
                  finder: {
                    fill: ColorToken.DarkGray13,
                  },
                }}
              />
            </div>
          )}

          <div tw="flex gap-1">
            <Button
              action={ButtonAction.Base}
              slotLeft={<Icon iconName={IconName.Rocket} />}
              state={{
                isLoading: isCopying,
              }}
              tw="flex-1"
              type={ButtonType.Link}
              href={affiliateProgram}
            >
              {stringGetter({ key: STRING_KEYS.BECOME_A_VIP })}
            </Button>
            <Button
              action={ButtonAction.Base}
              slotLeft={<Icon iconName={IconName.SocialX} />}
              onClick={() => {
                onCopyAndShare();
              }}
              state={{
                isLoading: isSharing,
              }}
              tw="flex-1 flex-grow-0 px-2"
            >
              {stringGetter({ key: STRING_KEYS.SHARE })}
            </Button>
          </div>
        </div>
      )}
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
