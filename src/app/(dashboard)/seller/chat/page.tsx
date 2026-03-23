// src/app/(dashboard)/seller/chat/page.tsx
import { redirect } from "next/navigation";
import { getSession as auth } from "@/lib/auth";
import { DashboardChatPage } from "@/components/chat/DashboardChatPage";

export default async function SellerChatPage() {
  const session = await auth();
  if (!session || (session.user as any).role !== "SELLER") redirect("/");
  return <DashboardChatPage currentUserId={(session.user as any).id} role="SELLER" />;
}