import { useCallback, useEffect, useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import styled from 'styled-components';
import tw from 'twin.macro';

import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { CopyButton } from '@/components/CopyButton';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, InputType } from '@/components/Input';

import {
  isValidReferralCodeFormat,
  parseReferralCodeError,
  sanitizeReferralCode,
  updateReferralCode,
} from '@/lib/affiliates';
import { track } from '@/lib/analytics/analytics';

export const EditAffiliateInput = ({
  className,
  slotRight,
  withAlertMessage = true,
}: {
  className?: string;
  slotRight?: React.ReactNode;
  withAlertMessage?: boolean;
}) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const {
    affiliateMetadataQuery: { data },
  } = useAffiliatesInfo(dydxAddress);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editableReferralCode, setEditableReferralCode] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const affiliateInputRef = useRef<HTMLInputElement>(null);

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

  const handleCancelEdit = useCallback(() => {
    setEditableReferralCode(data?.metadata?.referralCode ?? '');
    setIsEditMode(false);
    setUpdateError(null);
    setValidationError(null);
  }, [data?.metadata?.referralCode]);

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
            onClick={handleCancelEdit}
          />
          <IconButton
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
    handleCancelEdit,
    handleConfirmEdit,
    isEditMode,
    isUpdatingReferralCode,
    validationError,
  ]);

  return (
    <div className={className} tw="column gap-0.75">
      <$InputContainer>
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
          />
        </div>
        <ActionButtonsElement />
        {slotRight}
      </$InputContainer>
      {withAlertMessage && <AlertMessageElement />}
    </div>
  );
};

const $InputContainer = styled.div`
  ${tw`row gap-1 rounded-0.5 p-0.75`}
  background-color: var(--edit-affiliate-input-bgColor, var(--color-layer-3));
`;
