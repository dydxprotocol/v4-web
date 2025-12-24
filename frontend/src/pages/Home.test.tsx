import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home';
import { StarboardClientContext } from '@/contexts/StarboardClient.context';

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
