// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

const resend = new Resend(process.env.RESEND_API_KEY!);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate 6-digit OTP valid for 10 minutes
    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      resetOtp: otp,
      resetOtpExpiry: expiry,
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@nikshop.com",
      to: email,
      subject: "Your password reset code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; width: 48px; height: 48px; background: #000; border-radius: 12px; align-items: center; justify-content: center;">
              <span style="color: white; font-weight: bold; font-size: 20px;">S</span>
            </div>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #111; margin: 0 0 8px; text-align: center;">Reset your password</h1>
          <p style="font-size: 15px; color: #666; margin: 0 0 32px; text-align: center; line-height: 1.6;">
            Enter this 6-digit code to reset your NikShop password. The code expires in 10 minutes.
          </p>
          <div style="background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #111; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #999; text-align: center; margin: 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}