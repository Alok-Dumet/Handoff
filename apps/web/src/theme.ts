import { alpha, createTheme } from "@mui/material/styles";

const primaryMain = "#8fd7ff";
const secondaryMain = "#7ddcc7";

export function createAppTheme() {
  return createTheme({
    cssVariables: true,
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily:
        '"Avenir Next", "Segoe UI Variable", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeightLight: 400,
      h1: {
        fontFamily:
          '"Segoe UI Variable Display", "Avenir Next", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: 900,
        letterSpacing: "-0.045em",
        lineHeight: 0.98,
        textWrap: "balance",
      },
      h2: {
        fontFamily:
          '"Segoe UI Variable Display", "Avenir Next", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: 900,
        letterSpacing: "-0.038em",
        lineHeight: 1.02,
        textWrap: "balance",
      },
      h3: {
        fontWeight: 800,
        letterSpacing: "-0.028em",
        lineHeight: 1.08,
        textWrap: "balance",
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
      mode: "dark",
      primary: { main: primaryMain },
      secondary: { main: secondaryMain },
      background: {
        default: "#090d12",
        paper: "#101821",
      },
      text: {
        primary: "#f4f7f3",
        secondary: "#a8b2ad",
      },
      divider: alpha("#f4f7f3", 0.12),
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
              "transform 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
            "&:hover": {
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(1px) scale(0.99)",
            },
          },
          contained: {
            boxShadow: `0 8px 36px ${alpha(primaryMain, 0.24)}`,
            color: "#061015",
            "&:hover": {
              boxShadow: `0 8px 42px ${alpha(primaryMain, 0.3)}`,
            },
          },
          outlined: {
            borderColor: alpha("#f4f7f3", 0.24),
            color: "#f4f7f3",
            "&:hover": {
              borderColor: alpha("#f4f7f3", 0.44),
              backgroundColor: alpha("#f4f7f3", 0.06),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderColor: alpha("#f4f7f3", 0.12),
            backgroundImage:
              "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
            backgroundColor: "#101821",
            boxShadow: `0 24px 80px ${alpha("#000000", 0.28)}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: {
            borderColor: alpha("#f4f7f3", 0.12),
            backgroundImage:
              "linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))",
            backgroundColor: "#101821",
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

const theme = createAppTheme();

export default theme;
