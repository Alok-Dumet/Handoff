"use client";
import { createTheme } from "@mui/material/styles";

// App-wide MUI theme. cssVariables enables CSS theme variables (modern default).
const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  palette: {
    primary: { main: "#1565c0" },
  },
});

export default theme;
