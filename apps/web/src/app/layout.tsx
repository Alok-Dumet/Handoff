import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "HandOff",
  description: "Car rental platform",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-dvh flex-col bg-black">
          <SiteHeader user={user} />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
