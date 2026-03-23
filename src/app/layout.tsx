// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/shared/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NikkShop", template: "%s | NikkShop" },
  description: "A modern multi-seller marketplace. Buy, sell, and discover unique products.",
  keywords: ["marketplace", "ecommerce", "shop", "sell online"],
   icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  
  openGraph: {
    type: "website",
    siteName: "NikkShop",
    title: "NikkShop",
    description: "A modern multi-seller marketplace",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(224 71% 8%)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "hsl(213 31% 91%)",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
