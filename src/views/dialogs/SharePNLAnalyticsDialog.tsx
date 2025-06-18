import { useCallback, useMemo, useRef, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { toPng } from 'html-to-image';
import styled from 'styled-components';
import tw from 'twin.macro';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LogoIcon } from '@/icons/logo';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { QrCode } from '@/components/QrCode';
import { Tag, TagSign } from '@/components/Tag';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics/analytics';
import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { triggerTwitterIntent } from '@/lib/twitter';

export const SharePNLAnalyticsDialog = ({
  marketId,
  assetId,
  side,
  sideLabel,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnl,
  setIsOpen,
}: DialogProps<SharePNLAnalyticsDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const logoUrl = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetLogo, assetId);
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const pnlCardRef = useRef<HTMLDivElement>(null);

  const symbol = getDisplayableAssetFromBaseAsset(assetId);

  const onCopy = useCallback(async () => {
    if (pnlCardRef.current == null) {
      return;
    }

    try {
      setIsCopying(true);
      const dataUrl = await toPng(pnlCardRef.current, { cacheBust: true });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': dataUrl })]);
    } catch (error) {
      logBonsaiError('SharePNLAnalyticsDialog', 'onCopy', { error });
    } finally {
      setIsCopying(false);
    }
  }, [pnlCardRef]);

  const onCopyAndShare = useCallback(async () => {
    setIsSharing(true);
    await onCopy();

    triggerTwitterIntent({
      text: `${stringGetter({
        key: STRING_KEYS.TWEET_MARKET_POSITION,
        params: {
          MARKET: symbol,
        },
      })}\n\n#dYdX #${symbol}\n[${stringGetter({ key: STRING_KEYS.TWEET_PASTE_IMAGE_AND_DELETE_THIS })}]`,
      related: 'dYdX',
    });

    setIsSharing(false);

    dispatch(closeDialog());
  }, [dispatch, onCopy, stringGetter, symbol]);

  const sideSign = useMemo(() => {
    switch (side) {
      case IndexerPositionSide.LONG:
        return TagSign.Positive;
      case IndexerPositionSide.SHORT:
        return TagSign.Negative;
      default:
        return TagSign.Neutral;
    }
  }, [side]);

  const unrealizedPnlIsNegative = MustBigNumber(unrealizedPnl).isNegative();

  const [assetLeft, assetRight] = marketId.split('-');

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.SHARE_ACTIVITY })}>
      <$ShareableCard ref={pnlCardRef}>
        <div tw="flexColumn h-full">
          <div tw="row mb-0.75 gap-0.5">
            <AssetIcon logoUrl={logoUrl} symbol={assetId} tw="[--asset-icon-size:1.625rem]" />

            <span>
              <span tw="text-color-text-2 font-base-bold">{assetLeft}</span>/{assetRight}
            </span>

            <Tag sign={sideSign}>{sideLabel}</Tag>
          </div>

          <$HighlightOutput
            isNegative={unrealizedPnlIsNegative}
            type={OutputType.CompactFiat}
            value={unrealizedPnl}
            showSign={ShowSign.Both}
          />

          <LogoIcon tw="mt-auto h-auto w-[5.125rem]" />
        </div>

        <div tw="grid">
          <div tw="grid grid-cols-[repeat(2,1fr)] gap-[1.125rem] gap-y-0.5">
            <$ShareableCardStatLabel>
              {stringGetter({ key: STRING_KEYS.ENTRY })}
            </$ShareableCardStatLabel>
            <$ShareableCardStatOutput type={OutputType.Fiat} value={entryPrice} withSubscript />

            <$ShareableCardStatLabel>
              {stringGetter({ key: STRING_KEYS.INDEX })}
            </$ShareableCardStatLabel>
            <$ShareableCardStatOutput type={OutputType.Fiat} value={oraclePrice} withSubscript />

            <$ShareableCardStatLabel>
              {stringGetter({ key: STRING_KEYS.LEVERAGE })}
            </$ShareableCardStatLabel>

            <$ShareableCardStatOutput
              type={OutputType.Multiple}
              value={leverage}
              showSign={ShowSign.None}
            />
          </div>

          {import.meta.env.VITE_SHARE_PNL_ANALYTICS_URL ? (
            <$QrCode
              tw="rounded-0.25 bg-color-layer-3"
              size={68}
              value={import.meta.env.VITE_SHARE_PNL_ANALYTICS_URL}
              options={{
                cells: {
                  fill: 'var(--color-text-2)',
                },
                finder: {
                  fill: 'var(--color-text-2)',
                },
              }}
            />
          ) : (
            <div tw="mt-1 size-[68px]" />
          )}
        </div>
      </$ShareableCard>

      <div tw="flex gap-1">
        <$Action
          action={ButtonAction.Secondary}
          slotLeft={<Icon iconName={IconName.Copy} />}
          onClick={async () => {
            track(AnalyticsEvents.SharePnlCopied({ asset: assetId }));
            await onCopy();
          }}
          state={{
            isLoading: isCopying,
          }}
        >
          {stringGetter({ key: STRING_KEYS.COPY })}
        </$Action>
        <$Action
          action={ButtonAction.Primary}
          slotLeft={<Icon iconName={IconName.SocialX} />}
          onClick={async () => {
            track(AnalyticsEvents.SharePnlShared({ asset: assetId }));
            await onCopyAndShare();
          }}
          state={{
            isLoading: isSharing,
          }}
        >
          {stringGetter({ key: STRING_KEYS.SHARE })}
        </$Action>
      </div>
    </Dialog>
  );
};
const $Action = tw(Button)`flex-1`;

const $ShareableCard = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  background-color: var(--color-layer-4);
  padding: 1.75rem 1.25rem 1.25rem 1.25rem;
  border-radius: 0.5rem;
`;
const $ShareableCardStatLabel = tw.div`text-right text-color-text-0 font-base-bold`;

const $ShareableCardStatOutput = tw(Output)`font-base-bold text-color-text-2`;
const $QrCode = styled(QrCode)`
  width: 5.25rem;
  height: 5.25rem;
  margin-top: 1rem;
  margin-left: auto;

  svg {
    border: none;
  }
`;

const $HighlightOutput = styled(Output)<{ isNegative?: boolean }>`
  font-size: 2.25rem;
  font-weight: var(--fontWeight-bold);

  color: var(--output-sign-color);
  --secondary-item-color: currentColor;
  --output-sign-color: ${({ isNegative }) =>
    isNegative !== undefined
      ? isNegative
        ? `var(--color-negative)`
        : `var(--color-positive)`
      : `var(--color-text-1)`};
`;
