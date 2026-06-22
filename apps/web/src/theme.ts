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
      fontWeightLight: 400,
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
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
