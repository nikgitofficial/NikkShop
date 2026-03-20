// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Check expiry
    if (new Date() > user.resetOtpExpiry) {
      await User.findByIdAndUpdate(user._id, { resetOtp: null, resetOtpExpiry: null });
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
    }

    // Check OTP
    if (user.resetOtp !== otp) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // Update password and clear OTP
    const hashed = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(user._id, {
      password: hashed,
      resetOtp: null,
      resetOtpExpiry: null,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}