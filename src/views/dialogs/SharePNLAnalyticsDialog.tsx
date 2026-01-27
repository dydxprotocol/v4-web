import { useMemo, useRef, useState } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useSharePnlImage } from '@/hooks/useSharePnlImage';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics/analytics';
import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { triggerTwitterIntent } from '@/lib/twitter';

const copyBlobToClipboard = async (blob: Blob | null) => {
  if (!blob) {
    return;
  }

  try {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy blob. ', error);
    throw error;
  }
};

export const SharePNLAnalyticsDialog = ({
  marketId,
  assetId,
  side,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnl,
  setIsOpen,
}: DialogProps<SharePNLAnalyticsDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const symbol = getDisplayableAssetFromBaseAsset(assetId);
  const isCopying = useRef(false);
  const isSharing = useRef(false);
  const [isCopied, setIsCopied] = useState(false);

  const getPnlImage = useSharePnlImage({
    marketId,
    side,
    leverage,
    oraclePrice,
    entryPrice,
    unrealizedPnl,
    type: 'open',
  });

  const pnlImage = useMemo(() => getPnlImage.data ?? undefined, [getPnlImage.data]);

  const copyPnlImage = async () => {
    if (isCopying.current || !pnlImage) return;
    isCopying.current = true;
    await copyBlobToClipboard(pnlImage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    isCopying.current = false;
  };

  const sharePnlImage = async () => {
    if (isSharing.current || !pnlImage) return;
    isSharing.current = true;
    await copyBlobToClipboard(pnlImage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    triggerTwitterIntent({
      text: `${stringGetter({
        key: STRING_KEYS.TWEET_MARKET_POSITION,
        params: {
          MARKET: symbol,
        },
      })}\n\n#bonk_trade #${symbol}\n[${stringGetter({ key: STRING_KEYS.TWEET_PASTE_IMAGE_AND_DELETE_THIS })}]`,
      related: 'bonk_inu',
    });
    isSharing.current = false;

    dispatch(closeDialog());
  };

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.SHARE_ACTIVITY })}>
      <$ShareableCard>
        {!pnlImage ? (
          <div tw="flex h-full w-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <img
            src={URL.createObjectURL(pnlImage)}
            alt="Shareable PNL Card"
            tw="h-full w-full object-contain"
          />
        )}

        <div tw="mt-1 flex gap-1">
          <$Action
            action={ButtonAction.Secondary}
            slotLeft={<Icon iconName={isCopied ? IconName.Check : IconName.Copy} />}
            onClick={() => {
              track(AnalyticsEvents.SharePnlCopied({ asset: assetId }));
              copyPnlImage();
            }}
            state={{
              isLoading: !!isCopying.current,
            }}
          >
            {stringGetter({ key: isCopied ? STRING_KEYS.COPIED : STRING_KEYS.COPY })}
          </$Action>
          <$Action
            action={ButtonAction.Primary}
            slotLeft={<Icon iconName={IconName.SocialX} />}
            onClick={() => {
              track(AnalyticsEvents.SharePnlShared({ asset: assetId }));
              sharePnlImage();
            }}
            state={{
              isLoading: !!isSharing.current,
            }}
          >
            {stringGetter({ key: STRING_KEYS.SHARE })}
          </$Action>
        </div>
      </$ShareableCard>
    </Dialog>
  );
};

const $Action = tw(Button)`flex-1`;

const $ShareableCard = styled.div`
  ${layoutMixins.column}
  gap: 0.5rem;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 0.5rem;
`;
