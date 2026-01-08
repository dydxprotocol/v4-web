import { useCallback, useRef, useState } from 'react';

import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { AES, enc } from 'crypto-js';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/InputOtp';
import { WithLabel } from '@/components/WithLabel';

export const MobileQrScanner = () => {
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
      if (!encryptedPayload) setError(String(err ?? 'Scan error'));
    },
    [encryptedPayload]
  );

  const reset = () => {
    locked.current = false;
    setEncryptedPayload('');
    setError('');
    setEncryptionKey('');
  };

  const onSubmit = async () => {
    // TODO: Add tracking
    try {
      const decryptedPayload = AES.decrypt(encryptedPayload, encryptionKey).toString(enc.Utf8);
      const payload = JSON.parse(decryptedPayload);

      if (payload.privkeyHex) {
        const result = await importWallet(payload.privkeyHex);

        if (result.error) {
          // TODO: Map to localized error message
          setError(result.error);
        }
      } else {
        throw new Error('QR code could not be decrypted');
      }
    } catch (err) {
      // TODO: Map to localized error message
      setError(
        err instanceof Error ? err.message : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })
      );
    }
  };

  const displayResetButton = error || !encryptedPayload;

  return (
    <div tw="flexColumn gap-1">
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
        <WithLabel label="Encryption Key:">
          <div tw="row gap-0.5">
            <InputOTP
              containerClassName="w-full"
              value={encryptionKey}
              onChange={(value) => setEncryptionKey(value)}
              maxLength={6}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {!error && (
              <Button
                tw="w-fit"
                state={{ isDisabled: encryptionKey.length !== 6 }}
                onClick={onSubmit}
              >
                {stringGetter({ key: STRING_KEYS.SUBMIT })}
              </Button>
            )}
          </div>
        </WithLabel>
      )}

      {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}
      {displayResetButton && <Button onClick={reset}>Rescan QR code</Button>}
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
