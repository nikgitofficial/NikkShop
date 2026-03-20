// src/app/(dashboard)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardChatWrapper } from "@/components/chat/DashboardChatWrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/seller");

  const role = (session.user as any).role;
  if (role !== "SELLER" && role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role={role} user={session.user as any} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </div>
      <DashboardChatWrapper />
    </div>
  );
}