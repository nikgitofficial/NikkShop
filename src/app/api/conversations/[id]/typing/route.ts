// src/app/api/conversations/[id]/typing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import connectDB from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { typing } = await req.json();

    await connectDB();

    // Verify user is participant
    const conversation = await Conversation.findById(id).lean();
    if (!conversation || !(conversation.participants as string[]).includes(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Trigger typing event to the conversation channel
    await pusherServer.trigger(
      `conversation-${id}`,
      typing ? "typing-start" : "typing-stop",
      {
        userId: session.user.id,
        userName: session.user.name || "Someone",
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}