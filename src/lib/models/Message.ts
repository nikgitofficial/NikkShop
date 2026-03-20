// src/lib/models/Message.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  content?: string;
  image?: string;             // image message
  orderId?: string;           // order reference
  orderDetails?: {
    orderNumber: string;
    total: number;
    status: string;
  };
  readBy: string[];           // array of userIds who read it
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderImage: String,
    content: String,
    image: String,
    orderId: String,
    orderDetails: {
      orderNumber: String,
      total: Number,
      status: String,
    },
    readBy: [{ type: String }],
  },
  { timestamps: true }
);

const Message: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;