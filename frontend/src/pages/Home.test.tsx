import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StarboardClientContext } from '@/contexts/StarboardClient.context';
import Home from './Home';

describe('Home', () => {
  it('renders the title', () => {
    render(
      <StarboardClientContext.Provider value={null}>
        <Home />
      </StarboardClientContext.Provider>
    );

    expect(screen.getByText('Starboard')).toBeInTheDocument();
  });
});
