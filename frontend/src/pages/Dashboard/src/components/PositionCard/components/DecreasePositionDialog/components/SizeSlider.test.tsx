import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SizeSlider } from './SizeSlider';

describe('SizeSlider', () => {
  it('renders with label and percentage value', () => {
    render(<SizeSlider valueInPercents={50} onValueChange={vi.fn()} />);

    expect(screen.getByText('Percentage')).toBeInTheDocument();
    // 50% appears only in header (not in mark buttons which have 0, 25, 50, 75, 100)
    // but since 50 is a mark, we check for multiple
    const percentageTexts = screen.getAllByText('50%');
    expect(percentageTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('displays percentage value in header', () => {
    render(<SizeSlider valueInPercents={0} onValueChange={vi.fn()} />);

    // Both header and 0% button show "0%"
    const zeroPercentTexts = screen.getAllByText('0%');
    expect(zeroPercentTexts.length).toBe(2); // header + button
  });

  it('displays slider with current value', () => {
    render(<SizeSlider valueInPercents={100} onValueChange={vi.fn()} />);

    const slider = screen.getByRole('slider', { name: 'Decrease percentage' });
    expect(slider).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders percentage mark buttons', () => {
    render(<SizeSlider valueInPercents={0} onValueChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '0%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '25%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '75%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '100%' })).toBeInTheDocument();
  });

  it('calls onValueChange when percentage mark is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SizeSlider valueInPercents={0} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: '50%' }));

    expect(onValueChange).toHaveBeenCalledWith(50);
  });

  it('calls onValueChange with 100 when 100% mark is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SizeSlider valueInPercents={0} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: '100%' }));

    expect(onValueChange).toHaveBeenCalledWith(100);
  });

  it('calls onValueChange with 0 when 0% mark is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SizeSlider valueInPercents={50} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: '0%' }));

    expect(onValueChange).toHaveBeenCalledWith(0);
  });

  it('renders slider with correct aria label', () => {
    render(<SizeSlider valueInPercents={50} onValueChange={vi.fn()} />);

    expect(screen.getByRole('slider', { name: 'Decrease percentage' })).toBeInTheDocument();
  });

  it('rounds displayed percentage to whole number', () => {
    render(<SizeSlider valueInPercents={33.7} onValueChange={vi.fn()} />);

    expect(screen.getByText('34%')).toBeInTheDocument();
  });
});
