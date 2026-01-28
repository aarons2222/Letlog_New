import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RoleProvider } from "@/contexts/RoleContext";
import AppShellWrapper from "@/components/AppShellWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LetLog - Property Management Made Simple",
  description: "Modern property management for landlords, tenants, and contractors",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RoleProvider>
          <AppShellWrapper>{children}</AppShellWrapper>
        </RoleProvider>
        <Toaster />
      </body>
    </html>
  );
}
