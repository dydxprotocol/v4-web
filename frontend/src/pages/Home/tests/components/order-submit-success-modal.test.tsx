import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { OrderEntryFormModel } from '@/modules/order-entry-form/src/models';
import { OrderSubmitSuccessModal } from '../../src/components/order-submit-success-modal.component';

describe('OrderSubmitSuccessModal', () => {
  const mockFormData: OrderEntryFormModel = {
    orderMode: 'regular',
    orderExecutionType: 'limit',
    orderSide: 'buy',
    positionSize: '1.5',
    price: '50000',
    triggerPrice: '',
  };

  it('renders success message when open', () => {
    const mockOnOpenChange = vi.fn();
    render(
      <OrderSubmitSuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        formData={mockFormData}
      />
    );

    expect(screen.getByText('Order Submitted Successfully!')).toBeInTheDocument();
    expect(screen.getByText(/Yeah, good stuff! Here's your form data/)).toBeInTheDocument();
  });

  it('displays all form data fields', () => {
    const mockOnOpenChange = vi.fn();
    render(
      <OrderSubmitSuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        formData={mockFormData}
      />
    );

    expect(screen.getByText(/Order Mode:/)).toBeInTheDocument();
    expect(screen.getByText(/regular/)).toBeInTheDocument();
    expect(screen.getByText(/Execution Type:/)).toBeInTheDocument();
    expect(screen.getByText(/limit/)).toBeInTheDocument();
    expect(screen.getByText(/Side:/)).toBeInTheDocument();
    expect(screen.getByText(/buy/)).toBeInTheDocument();
    expect(screen.getByText(/Position Size:/)).toBeInTheDocument();
    expect(screen.getByText(/1.5/)).toBeInTheDocument();
    expect(screen.getByText(/Price:/)).toBeInTheDocument();
    expect(screen.getByText(/50000/)).toBeInTheDocument();
  });

  it('displays trigger price when provided', () => {
    const mockOnOpenChange = vi.fn();
    const formDataWithTrigger: OrderEntryFormModel = {
      ...mockFormData,
      triggerPrice: '45000',
    };

    render(
      <OrderSubmitSuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        formData={formDataWithTrigger}
      />
    );

    expect(screen.getByText(/Trigger Price:/)).toBeInTheDocument();
    expect(screen.getByText(/45000/)).toBeInTheDocument();
  });

  it('does not display trigger price when empty', () => {
    const mockOnOpenChange = vi.fn();
    render(
      <OrderSubmitSuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        formData={mockFormData}
      />
    );

    expect(screen.queryByText(/Trigger Price:/)).not.toBeInTheDocument();
  });

  it('calls onOpenChange when Nice button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();

    render(
      <OrderSubmitSuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        formData={mockFormData}
      />
    );

    const button = screen.getByText('Nice!');
    await user.click(button);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render when closed', () => {
    const mockOnOpenChange = vi.fn();
    render(
      <OrderSubmitSuccessModal
        open={false}
        onOpenChange={mockOnOpenChange}
        formData={mockFormData}
      />
    );

    expect(screen.queryByText('Order Submitted Successfully!')).not.toBeInTheDocument();
  });

  it('handles null formData gracefully', () => {
    const mockOnOpenChange = vi.fn();
    render(<OrderSubmitSuccessModal open={true} onOpenChange={mockOnOpenChange} formData={null} />);

    expect(screen.getByText('Order Submitted Successfully!')).toBeInTheDocument();
    expect(screen.queryByText(/Order Mode:/)).not.toBeInTheDocument();
  });
});
