import { useTurnkeyAuth } from '@/hooks/Onboarding/useTurnkeyAuth';

import { Button } from '@/components/Button';

export const Authenticate = () => {
  const { initEmailAuth, loginPasskey } = useTurnkeyAuth();

  return (
    <div>
      <h1>Authenticate</h1>
      <Button onClick={() => initEmailAuth({ targetUserEmail: 'test@test.com' })}>
        Initialize Email Auth
      </Button>
      <Button onClick={loginPasskey}>Login Passkey</Button>
    </div>
  );
};
