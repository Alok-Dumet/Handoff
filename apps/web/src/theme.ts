import { createTheme } from "@mui/material/styles";

export type AppThemeTokens = {
  primaryMain: string;
  secondaryMain: string;
};

export function createAppTheme(tokens: AppThemeTokens) {
  return createTheme({
    cssVariables: true,
    typography: {
      fontFamily: "Roboto, Arial, sans-serif",
    },
    palette: {
      primary: { main: tokens.primaryMain },
      secondary: { main: tokens.secondaryMain },
    },
  });
}

const theme = createAppTheme({
  primaryMain: "#1565c0",
  secondaryMain: "#00897b",
});

export default theme;
