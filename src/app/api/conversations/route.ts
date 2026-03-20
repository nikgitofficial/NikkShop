// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";

// GET — list all conversations for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const conversations = await Conversation.find({
      participants: session.user.id,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create or get existing conversation
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipientId, productId, productName, productImage, orderId } = await req.json();

    await connectDB();

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [session.user.id, recipientId] },
      ...(productId ? { productId } : {}),
    });

    if (!conversation) {
      // Fetch both users for participant details
      const [currentUser, recipient] = await Promise.all([
        User.findById(session.user.id).lean(),
        User.findById(recipientId).lean(),
      ]);

      if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

      conversation = await Conversation.create({
        participants: [session.user.id, recipientId],
        participantDetails: [
          {
            userId: session.user.id,
            name: currentUser?.name || session.user.name || "User",
            image: currentUser?.image || session.user.image,
            role: (session.user as any).role || "USER",
          },
          {
            userId: recipientId,
            name: recipient.name,
            image: recipient.image,
            role: recipient.role,
          },
        ],
        productId,
        productName,
        productImage,
        orderId,
        unreadCount: { [session.user.id]: 0, [recipientId]: 0 },
        lastMessageAt: new Date(),
      });
    }

    return NextResponse.json({ conversation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}