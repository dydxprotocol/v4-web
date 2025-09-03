import { useCallback, useEffect, useRef, useState } from 'react';

import { useToBlob } from '@hugocxl/react-to-image';
import { useMutation } from '@tanstack/react-query';
import styled from 'styled-components';

import {
  AFFILIATES_FEE_DISCOUNT_USD,
  AFFILIATES_REQUIRED_VOLUME_USD,
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonStyle,
  ButtonType,
} from '@/constants/buttons';
import { DialogProps, ShareAffiliateDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ColorToken } from '@/constants/styles/base';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { QrCode } from '@/components/QrCode';

import {
  isValidReferralCodeFormat,
  parseReferralCodeError,
  sanitizeReferralCode,
  updateReferralCode,
} from '@/lib/affiliates';
import { track } from '@/lib/analytics/analytics';
import { triggerTwitterIntent } from '@/lib/twitter';

import { AffiliateProgress } from '../Affiliates/AffiliateProgress';
import { OnboardingTriggerButton } from './OnboardingTriggerButton';

const copyBlobToClipboard = async (blob: Blob | null) => {
  if (!blob) {
    return;
  }

  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
};

export const ShareAffiliateDialog = ({ setIsOpen }: DialogProps<ShareAffiliateDialogProps>) => {
  const stringGetter = useStringGetter();
  const { affiliateProgramFaq, affiliateProgram } = useURLConfigs();
  const { dydxAddress } = useAccounts();
  const {
    affiliateMetadataQuery: { data },
    affiliateMaxEarningQuery: { data: maxEarningData },
  } = useAffiliatesInfo(dydxAddress);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editableReferralCode, setEditableReferralCode] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const affiliateInputRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const maxEarning = maxEarningData?.maxEarning;

  const { mutate: updateReferralCodeMutate, isPending: isUpdatingReferralCode } = useMutation({
    mutationFn: (newCode: string) => updateReferralCode(newCode),
    onSuccess: () => {
      setIsEditMode(false);
      setUpdateError(null);
    },
    onError: async (error: unknown) => {
      const errorMessage = await parseReferralCodeError(error);
      setUpdateError(stringGetter({ key: errorMessage }));
    },
  });

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

  const affiliatesUrl =
    data?.metadata?.referralCode && `${window.location.host}?ref=${data.metadata.referralCode}`;
  const editableAffiliatesUrl = `${window.location.host}?ref=${editableReferralCode}`;

  const validateReferralCode = (code: string): string | null => {
    if (code.length < 3) {
      return stringGetter({
        key: STRING_KEYS.REFERRAL_CODE_MIN_LENGTH_ERROR,
        params: {
          MIN_CHARACTERS: 3,
        },
      });
    }
    if (code.length > 32) {
      return stringGetter({
        key: STRING_KEYS.REFERRAL_CODE_MAX_LENGTH_ERROR,
        params: {
          MAX_CHARACTERS: 32,
        },
      });
    }
    if (!isValidReferralCodeFormat(code)) {
      return stringGetter({
        key: STRING_KEYS.REFERRAL_CODE_INVALID_CHARACTERS_ERROR,
      });
    }
    return null;
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setUpdateError(null);
  };

  const handleConfirmEdit = useCallback(async () => {
    updateReferralCodeMutate(editableReferralCode);
  }, [editableReferralCode, updateReferralCodeMutate]);

  const handleCancelEdit = useCallback(
    (e?: React.FocusEvent<HTMLInputElement>) => {
      if (e?.relatedTarget === confirmButtonRef.current) {
        return;
      }

      setEditableReferralCode(data?.metadata?.referralCode ?? '');
      setIsEditMode(false);
      setUpdateError(null);
      setValidationError(null);
    },
    [data?.metadata?.referralCode]
  );

  const handleReferralInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    const refMatch = newUrl.match(/\?ref=(.*)$/);

    const newCode = refMatch?.[1] ?? '';
    const sanitizedCode = sanitizeReferralCode(newCode);
    const error = validateReferralCode(sanitizedCode);

    setUpdateError(null);
    setEditableReferralCode(sanitizedCode);
    setValidationError(error);
  };

  useEffect(() => {
    if (data?.isEligible === undefined) return;

    track(
      AnalyticsEvents.AffiliateInviteFriendsModalOpened({ isAffiliateEligible: data.isEligible })
    );
  }, [data?.isEligible]);

  useEffect(() => {
    if (data?.metadata?.referralCode && !hasInitialized) {
      setEditableReferralCode(data.metadata.referralCode);
      setHasInitialized(true);
    }
  }, [data?.metadata?.referralCode, hasInitialized]);

  useEffect(() => {
    if (isEditMode && affiliateInputRef.current && !isUpdatingReferralCode) {
      affiliateInputRef.current.focus();
      const valLength = affiliateInputRef.current.value.length;
      affiliateInputRef.current.setSelectionRange(valLength, valLength);
      affiliateInputRef.current.scrollLeft = affiliateInputRef.current.scrollWidth;
    }
  }, [isEditMode, isUpdatingReferralCode]);

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

  const AlertMessageElement = useCallback(() => {
    if (isEditMode && validationError) {
      return <AlertMessage type={AlertType.Error}>{validationError}</AlertMessage>;
    }
    if (updateError) {
      return <AlertMessage type={AlertType.Error}>{updateError}</AlertMessage>;
    }
    if (isEditMode) {
      return (
        <AlertMessage type={AlertType.Notice}>
          {stringGetter({ key: STRING_KEYS.REFERRAL_CODE_UPDATE_WARNING })}
        </AlertMessage>
      );
    }
    return null;
  }, [isEditMode, stringGetter, updateError, validationError]);

  const ActionButtonsElement = useCallback(() => {
    if (affiliatesUrl && !isEditMode) {
      return (
        <div tw="row gap-0.5">
          <IconButton
            iconName={IconName.Pencil2}
            size={ButtonSize.Small}
            onClick={handleEdit}
            buttonStyle={ButtonStyle.WithoutBackground}
            shape={ButtonShape.Square}
          />
          <CopyButton
            action={ButtonAction.Primary}
            size={ButtonSize.Small}
            value={affiliatesUrl}
            onCopy={() => {
              track(AnalyticsEvents.AffiliateURLCopied({ url: affiliatesUrl }));
            }}
          />
        </div>
      );
    }

    if (isEditMode) {
      return (
        <div tw="row gap-0.5">
          <IconButton
            iconName={IconName.Close}
            size={ButtonSize.Small}
            action={ButtonAction.Destroy}
            shape={ButtonShape.Square}
            state={{ isDisabled: isUpdatingReferralCode }}
          />
          <IconButton
            ref={confirmButtonRef}
            iconName={IconName.Check}
            size={ButtonSize.Small}
            onClick={handleConfirmEdit}
            action={ButtonAction.Primary}
            shape={ButtonShape.Square}
            state={{
              isLoading: isUpdatingReferralCode,
              isDisabled: editableReferralCode.length === 0 || !!validationError,
            }}
          />
        </div>
      );
    }

    return null;
  }, [
    affiliatesUrl,
    editableReferralCode.length,
    handleConfirmEdit,
    isEditMode,
    isUpdatingReferralCode,
    validationError,
  ]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.UNLOCK_AFFILIATE_PROGRAM })}
      description={dialogDescription}
      withAnimation
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
          <div tw="column gap-0.75">
            <div tw="row gap-1 rounded-0.5 bg-color-layer-2 p-0.75">
              <div tw="flex-1">
                <div tw="text-small text-color-text-0">
                  {stringGetter({ key: STRING_KEYS.AFFILIATE_LINK })}
                </div>
                <Input
                  ref={affiliateInputRef}
                  type={InputType.Text}
                  value={isEditMode ? editableAffiliatesUrl : affiliatesUrl}
                  onChange={handleReferralInputChange}
                  disabled={!isEditMode}
                  $backgroundColorOverride="transparent"
                  $withEllipsis
                  onBlur={handleCancelEdit}
                />
              </div>
              <ActionButtonsElement />
            </div>
            <AlertMessageElement />
          </div>
          {affiliatesUrl && (
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
                convertShare();
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
