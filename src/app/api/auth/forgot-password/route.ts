// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

const resend = new Resend(process.env.RESEND_API_KEY!);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function emailTemplate(otp: string, name: string, year: number) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img
                      src="https://nikk-shop.vercel.app/logo.png"
                      alt="NikkShop"
                      width="50"
                      height="50"
                      style="display:block;"
                    />
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:800;color:#111;letter-spacing:-0.5px;">NikkShop</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:20px;border:1px solid #e4e4e7;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="height:4px;background:linear-gradient(90deg,#18181b 0%,#52525b 100%);"></td></tr>
                <tr>
                  <td style="padding:36px 40px 32px;">
                    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111;">Reset your password</p>
                    <p style="margin:0 0 28px;font-size:14px;color:#71717a;line-height:1.6;">
                      Hi ${name}, here is your one-time code to reset your NikkShop password. It expires in <strong style="color:#111;">10 minutes</strong>.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center" style="background:#fafafa;border:1.5px dashed #d4d4d8;border-radius:14px;padding:28px 20px;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#a1a1aa;letter-spacing:2px;text-transform:uppercase;">Your verification code</p>
                          <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:14px;color:#111;font-family:'Courier New',Courier,monospace;padding-left:14px;">${otp}</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.6;">
                      Enter this code on the password reset page. For your security, never share this code with anyone.
                    </p>
                    <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;" />
                    <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                      If you did not request a password reset, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${year} NikkShop · All rights reserved</p>
              <p style="margin:4px 0 0;font-size:11px;color:#c4c4c7;">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return NextResponse.json({ success: true });

    const otp    = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, { resetOtp: otp, resetOtpExpiry: expiry });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@nikkshop.com",
      to: email,
      subject: `${otp} is your NikkShop reset code`,
      html: emailTemplate(otp, user.name?.split(" ")[0] || "there", new Date().getFullYear()),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}