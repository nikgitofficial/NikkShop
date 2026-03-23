// src/app/(auth)/layout.tsx
import { Navbar } from "@/components/layout/Navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 py-12">
        {children}
      </div>

      {/* Bottom */}
      <div className="p-6 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} NikkShop. All rights reserved.
      </div>
    </div>
  );
}