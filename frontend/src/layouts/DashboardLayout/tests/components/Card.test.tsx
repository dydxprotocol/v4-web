import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from '../../src/components/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div>Test content</div>
      </Card>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies additional className when provided', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });

  it('renders as a div element by default', () => {
    const { container } = render(
      <Card>
        <div>Content</div>
      </Card>
    );

    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});
