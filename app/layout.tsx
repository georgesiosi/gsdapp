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
  // Check if we're in staging environment
  const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Staging environment indicator */}
        {isStaging && (
          <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: '#ff5722',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 9999,
          }}>
            STAGING
          </div>
        )}
        <ClerkProvider
          appearance={{
            baseTheme: undefined
          }}
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
