import { describe, expect, it } from 'vitest';

import { parseLocationHash } from '@/lib/urlUtils';

describe('parseLocationHash', () => {
  it('returns the path separated from hash', () => {
    const hash = '#/markets';
    expect(parseLocationHash(hash)).toEqual('/markets');
  });
  it('returns the path and query string separated from hash', () => {
    const hash = '#/markets?displayinitializingmarkets=true';
    expect(parseLocationHash(hash)).toEqual('/markets?displayinitializingmarkets=true');
  });
});
