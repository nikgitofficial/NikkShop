// src/app/(storefront)/layout.tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
      </div>
    </CurrencyProvider>
  );
}