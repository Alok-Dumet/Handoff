import { alpha, createTheme } from "@mui/material/styles";

export type AppThemeTokens = {
  primaryMain: string;
  secondaryMain: string;
};

export function createAppTheme(tokens: AppThemeTokens) {
  return createTheme({
    cssVariables: true,
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily: "Roboto, Helvetica, Arial, sans-serif",
      fontWeightLight: 400,
      h1: {
        fontWeight: 800,
        letterSpacing: "-0.055em",
        lineHeight: 0.95,
      },
      h2: {
        fontWeight: 800,
        letterSpacing: "-0.045em",
        lineHeight: 1,
      },
      h3: {
        fontWeight: 800,
        letterSpacing: "-0.035em",
        lineHeight: 1.05,
      },
      h4: {
        fontWeight: 800,
        letterSpacing: "-0.025em",
        lineHeight: 1.08,
      },
      h5: { fontWeight: 700, letterSpacing: "-0.015em" },
      h6: { fontWeight: 700, letterSpacing: "-0.01em" },
      button: {
        fontWeight: 700,
        letterSpacing: "-0.01em",
        textTransform: "none",
      },
      overline: {
        fontWeight: 800,
        letterSpacing: "0.12em",
      },
    },
    palette: {
      primary: { main: tokens.primaryMain },
      secondary: { main: tokens.secondaryMain },
      background: {
        default: "#f5f7f4",
        paper: "#ffffff",
      },
      text: {
        primary: "#101510",
        secondary: "#566155",
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            boxShadow: "none",
            whiteSpace: "nowrap",
            transition:
              "transform 180ms ease, background-color 180ms ease, border-color 180ms ease",
            "&:active": {
              transform: "translateY(1px) scale(0.99)",
            },
          },
          contained: {
            boxShadow: `0 16px 36px ${alpha(tokens.primaryMain, 0.24)}`,
            "&:hover": {
              boxShadow: `0 18px 42px ${alpha(tokens.primaryMain, 0.3)}`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderColor: alpha("#101510", 0.1),
            boxShadow: `0 24px 80px ${alpha("#1f2a1f", 0.08)}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: {
            borderColor: alpha("#101510", 0.1),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
    },
  });
}

const theme = createAppTheme({
  primaryMain: "#1565c0",
  secondaryMain: "#00897b",
});

export default theme;
