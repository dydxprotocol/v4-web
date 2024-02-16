import { describe, expect, it } from 'vitest';

import { parseHash } from '@/lib/urlUtils';

describe('parseHash', () => {
  it('returns the path separated from hash', () => {
    const hash = '#/markets';
    expect(parseHash(hash)).toEqual('/markets');
  });
  it('returns the path and query string separated from hash', () => {
    const hash = '#/markets?displayinitializingmarkets=true';
    expect(parseHash(hash)).toEqual('/markets?displayinitializingmarkets=true');
  });
});
