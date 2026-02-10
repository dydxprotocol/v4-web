import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { AES, enc } from 'crypto-js';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/InputOtp';

export const MobileQrScanner = ({
  setHasScannedQrCode,
}: {
  setHasScannedQrCode: (hasScannedQrCode: boolean) => void;
}) => {
  const stringGetter = useStringGetter();
  const [encryptedPayload, setEncryptedPayload] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const locked = useRef(false); // prevent duplicate fires

  const { importWallet } = useAccounts();

  const onScan = useCallback((detectedCodes: IDetectedBarcode[]) => {
    if (locked.current) return;
    locked.current = true;
    setEncryptedPayload(detectedCodes[0]?.rawValue ?? '');
  }, []);

  const handleError = useCallback(
    (err?: unknown) => {
      logBonsaiError('MobileQrScanner', 'scan error', { error: err });
      if (!encryptedPayload) {
        setError(stringGetter({ key: STRING_KEYS.QR_SCAN_ERROR }));
      }
    },
    [encryptedPayload, stringGetter]
  );

  const reset = () => {
    locked.current = false;
    setEncryptedPayload('');
    setError('');
    setEncryptionKey('');
  };

  useLayoutEffect(() => {
    setHasScannedQrCode(encryptedPayload.trim().length > 0);
  }, [encryptedPayload, setHasScannedQrCode]);

  const onSubmit = async () => {
    try {
      const decryptedPayload = AES.decrypt(encryptedPayload, encryptionKey).toString(enc.Utf8);
      const payload = JSON.parse(decryptedPayload);

      if (payload && typeof payload.mnemonic === 'string' && payload.mnemonic.length > 0) {
        const result = await importWallet(payload.mnemonic);

        if (result.error) {
          setError(stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }));
        }
      } else {
        throw new Error('QR code could not be decrypted');
      }
    } catch (err) {
      logBonsaiError('MobileQrScanner', 'onSubmit failed', { error: err });
      setError(stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }));
    }
  };

  const displayResetButton = error && encryptedPayload;

  return (
    <div tw="flexColumn h-full gap-1">
      {!encryptedPayload ? (
        <div tw="relative">
          <Scanner
            onScan={onScan}
            onError={handleError}
            formats={['qr_code']}
            constraints={{ facingMode: { ideal: 'environment' } }}
            components={{
              finder: false,
            }}
            scanDelay={150} // reduce CPU on mobile
            styles={{ container: { width: '100%', borderRadius: 12, overflow: 'hidden' } }}
            sound={false}
          />

          <Finder />
        </div>
      ) : (
        <div tw="row mt-1.5 gap-0.5">
          <InputOTP
            value={encryptionKey}
            onChange={(value: string) => setEncryptionKey(value)}
            maxLength={6}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              // eslint-disable-next-line react/no-array-index-key
              <InputOTPGroup key={`group-${index}`}>
                <InputOTPSlot index={index} />
              </InputOTPGroup>
            ))}
          </InputOTP>
        </div>
      )}

      {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}

      <div tw="flexColumn mt-auto gap-1">
        {displayResetButton && (
          <Button tw="w-full font-base-book" onClick={reset} size={ButtonSize.Large}>
            {stringGetter({ key: STRING_KEYS.TRY_AGAIN })}
          </Button>
        )}
        {!error && encryptedPayload && (
          <Button
            tw="w-full font-base-book"
            size={ButtonSize.Large}
            state={{ isDisabled: encryptionKey.length !== 6 }}
            action={ButtonAction.SimplePrimary}
            onClick={onSubmit}
          >
            {stringGetter({ key: STRING_KEYS.SUBMIT })}
          </Button>
        )}
      </div>
    </div>
  );
};

const Finder = () => {
  return (
    <div tw="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div tw="relative aspect-square w-3/4">
        <$FinderEdge tw="left-0 top-0 border-b-0 border-r-0" />
        <$FinderEdge tw="right-0 top-0 border-b-0 border-l-0" />
        <$FinderEdge tw="bottom-0 left-0 border-r-0 border-t-0" />
        <$FinderEdge tw="bottom-0 right-0 border-l-0 border-t-0" />
      </div>
    </div>
  );
};

const $FinderEdge = styled.div`
  position: absolute;
  height: 1rem;
  width: 1rem;
  border: 0.25rem solid var(--color-accent);
`;
