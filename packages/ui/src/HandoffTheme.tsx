import React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0A1628',
      light: '#1a2a44',
      dark: '#060e1a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F5A623',
      light: '#f7b84d',
      dark: '#d48e1a',
      contrastText: '#0A1628',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(10, 22, 40, 0.08)',
        },
      },
    },
  },
});

interface HandoffThemeProps {
  children: React.ReactNode;
}

export function HandoffTheme({ children }: HandoffThemeProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
