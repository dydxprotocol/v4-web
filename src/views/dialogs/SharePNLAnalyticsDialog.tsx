import { useMemo, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
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
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const getPnlImage = useSharePnlImage({
    assetId,
    marketId,
    side,
    leverage,
    oraclePrice,
    entryPrice,
    unrealizedPnl,
  });

  const pnlImage = useMemo(() => getPnlImage.data ?? undefined, [getPnlImage.data]);

  const copyPnlImage = async () => {
    if (isCopying || isCopied || !pnlImage) return;
    setIsCopying(true);
    try {
      await copyBlobToClipboard(pnlImage);
      track(AnalyticsEvents.SharePnlCopied({ asset: assetId }));
      setIsCopying(false);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      logBonsaiError('SharePNLAnalyticsDialog/copyPnlImage', 'Failed to copy PNL image', { error });
    } finally {
      setIsCopying(false);
    }
  };

  const sharePnlImage = async () => {
    if (isSharing || !pnlImage) return;
    setIsSharing(true);
    try {
      await copyBlobToClipboard(pnlImage);
      triggerTwitterIntent({
        text: `${stringGetter({
          key: STRING_KEYS.TWEET_MARKET_POSITION,
          params: {
            MARKET: symbol,
          },
        })}\n\n#dydx #${symbol}\n[${stringGetter({ key: STRING_KEYS.TWEET_PASTE_IMAGE_AND_DELETE_THIS })}]`,
        related: 'dYdX',
      });
      track(AnalyticsEvents.SharePnlShared({ asset: assetId }));
      setIsSharing(false);
    } catch (error) {
      logBonsaiError('SharePNLAnalyticsDialog/sharePnlImage', 'Failed to share PNL image', {
        error,
      });
    } finally {
      setIsSharing(false);
    }

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
            onClick={copyPnlImage}
            state={{
              isLoading: isCopying,
            }}
          >
            {stringGetter({ key: isCopied ? STRING_KEYS.COPIED : STRING_KEYS.COPY })}
          </$Action>
          <$Action
            action={ButtonAction.Primary}
            slotLeft={<Icon iconName={IconName.SocialX} />}
            onClick={sharePnlImage}
            state={{
              isLoading: isSharing,
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
