import { useCallback, useRef, useState } from 'react';

import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';

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
  };

  return (
    <div tw="flexColumn gap-1">
      {!encryptedPayload ? (
        <>
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

          {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}
        </>
      ) : (
        <>
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

              <Button tw="w-fit" state={{ isDisabled: encryptionKey.length !== 6 }}>
                {stringGetter({ key: STRING_KEYS.SUBMIT })}
              </Button>
            </div>
          </WithLabel>

          {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}

          <Button onClick={reset}>Rescan QR code</Button>
        </>
      )}
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
