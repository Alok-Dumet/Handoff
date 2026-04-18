import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { BookingCard } from '@handoff/ui';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const defaultProps = {
  bookingRef: 'HO-2024-001',
  customerName: 'Alok Sharma',
  vehicleClass: 'Economy',
  pickupDate: '2024-03-15',
  returnDate: '2024-03-18',
  location: 'London Heathrow T5',
};

describe('BookingCard', () => {
  it('renders booking reference', () => {
    renderWithTheme(<BookingCard {...defaultProps} />);
    expect(screen.getByText('HO-2024-001')).toBeInTheDocument();
  });

  it('renders customer name', () => {
    renderWithTheme(<BookingCard {...defaultProps} />);
    expect(screen.getByText('Alok Sharma')).toBeInTheDocument();
  });

  it('renders vehicle class', () => {
    renderWithTheme(<BookingCard {...defaultProps} />);
    expect(screen.getByText('Economy')).toBeInTheDocument();
  });

  it('renders pickup and return dates', () => {
    renderWithTheme(<BookingCard {...defaultProps} />);
    expect(screen.getByText('2024-03-15')).toBeInTheDocument();
    expect(screen.getByText('2024-03-18')).toBeInTheDocument();
  });

  it('renders location', () => {
    renderWithTheme(<BookingCard {...defaultProps} />);
    expect(screen.getByText('London Heathrow T5')).toBeInTheDocument();
  });

  it('renders "Booking Summary" heading', () => {
    renderWithTheme(<BookingCard {...defaultProps} />);
    expect(screen.getByText('Booking Summary')).toBeInTheDocument();
  });
});
