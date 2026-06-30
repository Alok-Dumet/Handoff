import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "HandOff",
  description: "Car rental platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme:dark,
        elements: {
          cardBox: {
            border: "2px solid rgb(255, 255, 255)",
            borderRadius: "0.5rem",
            // boxShadow: "0 0 100px 2px rgb(255, 255, 255)",
          },
          headerTitle: "text-xl font-semibold tracking-tight",
        },
      }}
      localization={{
        signIn: {
          start: {
            title: "Sign in to HandOff",
            subtitle: "Welcome back — pick up where you left off.",
          },
        },
        signUp: {
          start: {
            title: "Create your HandOff account",
            subtitle: "Get on the road in minutes.",
          },
        },
      }}
    >
      <html lang="en">
        <body>
          <AppRouterCacheProvider>
            <div className="flex min-h-dvh flex-col bg-black">
              <SiteHeader />
              <main className="flex flex-1 flex-col">{children}</main>
              <SiteFooter />
            </div>
          </AppRouterCacheProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
