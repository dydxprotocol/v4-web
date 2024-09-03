import { useToBlob } from '@hugocxl/react-to-image';
import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogProps, ShareAffiliateDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ColorToken } from '@/constants/styles/base';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';

import { triggerTwitterIntent } from '@/lib/twitter';

const DUMMY_AFFILIATE_CODE = 'dummy_affiliate_code';

const copyBlobToClipboard = async (blob: Blob | null) => {
  if (!blob) {
    return;
  }

  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
};

export const ShareAffiliateDialog = ({ setIsOpen }: DialogProps<ShareAffiliateDialogProps>) => {
  const stringGetter = useStringGetter();

  const [{ isLoading: isCopying }, convert, ref] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: copyBlobToClipboard,
  });

  const [{ isLoading: isSharing }, convertShare, refShare] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: async (blob) => {
      await copyBlobToClipboard(blob);

      triggerTwitterIntent({
        text: `${stringGetter({
          key: STRING_KEYS.TWEET_MARKET_POSITION,
          params: {
            MARKET: DUMMY_AFFILIATE_CODE,
          },
        })}\n\n#dYdX \n[${stringGetter({ key: STRING_KEYS.TWEET_PASTE_IMAGE_AND_DELETE_THIS })}]`,
        related: 'dYdX',
      });
    },
  });

  const affiliatesUrl = `${window.location.host}/r/${DUMMY_AFFILIATE_CODE}`;

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title="Invite Friends!"
      description="Earn up to $1,500/mo for each new trader you refer. Your referral can save up to $550 in trading fees. Learn more"
    >
      <div tw="column gap-1">
        <div tw="row justify-between rounded-0.5 bg-color-layer-6 px-1 py-0.5">
          <div>
            <div tw="text-small text-color-text-0">Affiliate Link</div>
            <div>{affiliatesUrl}</div>
          </div>
          <Button action={ButtonAction.Primary} size={ButtonSize.Small}>
            Copy Link
          </Button>
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
                color: ColorToken.DarkGray12,
              },
              cornersSquareOptions: {
                type: 'extra-rounded',
                color: ColorToken.DarkGray12,
              },
              imageOptions: {
                margin: 0,
              },
            }}
            value={affiliatesUrl}
          />
        </div>

        <div tw="flex gap-1">
          <$Action
            action={ButtonAction.Secondary}
            slotLeft={<Icon iconName={IconName.Copy} />}
            onClick={() => {
              convert();
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
            onClick={() => {
              convertShare();
            }}
            state={{
              isLoading: isSharing,
            }}
          >
            {stringGetter({ key: STRING_KEYS.SHARE })}
          </$Action>
        </div>
      </div>
    </Dialog>
  );
};

const $Action = tw(Button)`flex-1`;

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
