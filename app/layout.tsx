import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { DataMigrationDialog } from "@/components/auth/data-migration-dialog";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

// Metadata is now handled by generateMetadata()

// Properly handle headers
export async function generateMetadata() {
  return {
    title: "GSD App",
    description: "Get Stuff Done - A task management app",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enhanced debug logging for Clerk configuration
  console.log("Clerk Environment:", {
    publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN,
    issuerUrl: process.env.NEXT_PUBLIC_CLERK_ISSUER_URL,
    environment: process.env.NODE_ENV
  });
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider
          appearance={{
            baseTheme: undefined
          }}
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <Providers>
            {children}
            <DataMigrationDialog />
            <Toaster />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
