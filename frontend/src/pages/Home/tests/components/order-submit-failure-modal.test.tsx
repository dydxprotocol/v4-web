import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderSubmitFailureModal } from '../../src/components/order-submit-failure-modal.component';

describe('OrderSubmitFailureModal', () => {
  it('renders validation errors when open', () => {
    const mockOnOpenChange = vi.fn();
    const errors = ['Position size: Value must be greater than 0', 'Price: Required field'];

    render(<OrderSubmitFailureModal open={true} onOpenChange={mockOnOpenChange} errors={errors} />);

    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    expect(
      screen.getByText('Please fix the following errors before submitting:')
    ).toBeInTheDocument();
  });

  it('displays all error messages', () => {
    const mockOnOpenChange = vi.fn();
    const errors = [
      'Position size: Value must be greater than 0',
      'Price: Required field',
      'Order side: Invalid value',
    ];

    render(<OrderSubmitFailureModal open={true} onOpenChange={mockOnOpenChange} errors={errors} />);

    errors.forEach((error) => {
      expect(screen.getByText(new RegExp(error))).toBeInTheDocument();
    });
  });

  it('renders each error with a bullet point', () => {
    const mockOnOpenChange = vi.fn();
    const errors = ['Position size: Value must be greater than 0', 'Price: Required field'];

    render(<OrderSubmitFailureModal open={true} onOpenChange={mockOnOpenChange} errors={errors} />);

    const errorElements = screen.getAllByText(/•/);
    expect(errorElements).toHaveLength(errors.length);
  });

  it('calls onOpenChange when OK button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    const errors = ['Position size: Value must be greater than 0'];

    render(<OrderSubmitFailureModal open={true} onOpenChange={mockOnOpenChange} errors={errors} />);

    const button = screen.getByText('OK');
    await user.click(button);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render when closed', () => {
    const mockOnOpenChange = vi.fn();
    const errors = ['Position size: Value must be greater than 0'];

    render(
      <OrderSubmitFailureModal open={false} onOpenChange={mockOnOpenChange} errors={errors} />
    );

    expect(screen.queryByText('Validation Errors')).not.toBeInTheDocument();
  });

  it('handles empty errors array', () => {
    const mockOnOpenChange = vi.fn();
    const errors: string[] = [];

    render(<OrderSubmitFailureModal open={true} onOpenChange={mockOnOpenChange} errors={errors} />);

    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    expect(screen.queryByText(/•/)).not.toBeInTheDocument();
  });

  it('displays errors with proper styling', () => {
    const mockOnOpenChange = vi.fn();
    const errors = ['Position size: Value must be greater than 0'];

    render(<OrderSubmitFailureModal open={true} onOpenChange={mockOnOpenChange} errors={errors} />);

    const errorText = screen.getByText(/Position size: Value must be greater than 0/);
    expect(errorText).toBeInTheDocument();
  });
});
