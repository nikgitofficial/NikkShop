// src/lib/models/Conversation.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  _id: string;
  participants: string[];         // [buyerId, sellerId]
  participantDetails: {
    userId: string;
    name: string;
    image?: string;
    role: string;
  }[];
  productId?: string;             // optional product reference
  productName?: string;
  productImage?: string;
  orderId?: string;               // optional order reference
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: Record<string, number>; // { userId: count }
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: String, required: true }],
    participantDetails: [
      {
        userId: String,
        name: String,
        image: String,
        role: String,
      },
    ],
    productId: String,
    productName: String,
    productImage: String,
    orderId: String,
    lastMessage: String,
    lastMessageAt: Date,
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;