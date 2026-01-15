import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardHeader } from '../../src/components/DashboardHeader';

describe('DashboardHeader', () => {
  it('renders title correctly', () => {
    render(<DashboardHeader title="Test Title" subtitle="Test Subtitle" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<DashboardHeader title="Title" subtitle="Test Subtitle" />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders both title and subtitle elements', () => {
    const { container } = render(<DashboardHeader title="Title" subtitle="Subtitle" />);

    const h1 = container.querySelector('h1');
    const p = container.querySelector('p');

    expect(h1).toBeInTheDocument();
    expect(p).toBeInTheDocument();
  });
});
