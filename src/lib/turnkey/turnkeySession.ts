import { Turnkey, type TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';

import { TURNKEY_CONFIG } from '@/constants/turnkey';

export type TurnkeyUserSession = {
  // The user's own Turnkey organization
  organizationId: string;
  client: TurnkeyIndexedDbClient;
};

/**
 * The Turnkey session of the signed-in user, for code that runs outside React and so cannot use
 * the client of `TurnkeyProvider`. The session and the key that authenticates it are kept in the
 * browser's storage, so a client created here acts for the same user.
 *
 * @returns undefined if there is no session or it has expired. A session lasts 15 minutes from
 * sign-in; after that the user has to sign in again before anything can be signed for them.
 */
export async function getTurnkeyUserSession(): Promise<TurnkeyUserSession | undefined> {
  const turnkey = new Turnkey(TURNKEY_CONFIG);
  const session = await turnkey.getSession();
  if (session == null) {
    return undefined;
  }

  // Only reached with a live session, so the key exists and this loads it. With no key stored
  // it would make a new one, which must be left to the sign-in flow.
  const client = await turnkey.indexedDbClient();
  await client.init();
  return { organizationId: session.organizationId, client };
}
