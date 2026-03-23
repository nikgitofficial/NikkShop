// src/app/(dashboard)/admin/chat/page.tsx
import { redirect } from "next/navigation";
import { getSession as auth } from "@/lib/auth";
import { DashboardChatPage } from "@/components/chat/DashboardChatPage";

export default async function AdminChatPage() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");
  return <DashboardChatPage currentUserId={(session.user as any).id} role="ADMIN" />;
}