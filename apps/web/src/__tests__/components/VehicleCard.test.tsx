import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { VehicleCard } from '@handoff/ui';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const defaultProps = {
  name: 'BMW 3 Series',
  class: 'Premium',
  pricePerDay: 95,
  features: ['AC', 'Leather', 'Nav'],
  imageUrl: 'https://example.com/bmw.jpg',
  isSelected: false,
  onSelect: jest.fn(),
};

describe('VehicleCard', () => {
  it('renders vehicle name and class', () => {
    renderWithTheme(<VehicleCard {...defaultProps} />);
    expect(screen.getByText('BMW 3 Series')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('renders price per day', () => {
    renderWithTheme(<VehicleCard {...defaultProps} />);
    expect(screen.getByText('$95')).toBeInTheDocument();
    expect(screen.getByText('/day')).toBeInTheDocument();
  });

  it('renders all features', () => {
    renderWithTheme(<VehicleCard {...defaultProps} />);
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.getByText('Leather')).toBeInTheDocument();
    expect(screen.getByText('Nav')).toBeInTheDocument();
  });

  it('calls onSelect when the select button is clicked', () => {
    const onSelect = jest.fn();
    renderWithTheme(<VehicleCard {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows "Selected" chip when isSelected is true', () => {
    renderWithTheme(<VehicleCard {...defaultProps} isSelected={true} />);
    const selectedChips = screen.getAllByText('Selected');
    expect(selectedChips.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show "Selected" chip when isSelected is false', () => {
    renderWithTheme(<VehicleCard {...defaultProps} isSelected={false} />);
    expect(screen.queryByText('Selected')).not.toBeInTheDocument();
  });
});
