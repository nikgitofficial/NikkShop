// src/app/(auth)/forgot-password/page.tsx
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Code sent!", { description: `Check ${email} for your 6-digit code.` });
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      // We verify inline — if wrong the reset-password API will reject it
      // Just move to password step optimistically; error caught there
      setStep("password");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Reset password ────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(""), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If OTP was wrong, go back to OTP step
        if (data.error?.toLowerCase().includes("code") || data.error?.toLowerCase().includes("expired")) {
          setStep("otp");
          setOtp(["", "", "", "", "", ""]);
        }
        throw new Error(data.error);
      }
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handler ─────────────────────────────────────────
  function handleOtpChange(idx: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    if (value && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  }

  const stepLabels = ["Email", "Verify", "New password"];
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          {step === "done" ? (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Password reset!</h1>
              <p className="text-gray-400 text-sm">Your password has been updated successfully.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
              <p className="text-gray-400 text-sm">
                {step === "email" && "Enter your email and we'll send you a code."}
                {step === "otp" && `Enter the 6-digit code sent to ${email}`}
                {step === "password" && "Choose a new password for your account."}
              </p>
            </>
          )}
        </div>

        {/* Step indicators */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-8">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium",
                  i < stepIndex ? "text-green-600" : i === stepIndex ? "text-gray-900" : "text-gray-300"
                )}>
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                    i < stepIndex ? "bg-green-500 text-white" :
                    i === stepIndex ? "bg-black text-white" :
                    "bg-gray-100 text-gray-400"
                  )}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={cn("flex-1 h-px", i < stepIndex ? "bg-green-300" : "bg-gray-100")} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send reset code
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  className={cn(
                    "w-11 h-14 text-center text-xl font-bold text-gray-900 bg-white border-2 rounded-xl outline-none transition-all",
                    digit ? "border-black" : "border-gray-200",
                    "focus:border-black focus:ring-2 focus:ring-gray-100"
                  )}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify code
            </button>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Change email
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-gray-600 font-medium hover:text-black transition-colors disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: New password ── */}
        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="New password (min 8 chars)"
                className="w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                    /[^A-Za-z0-9]/.test(password),
                  ].map((met, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-colors",
                        met ? "bg-green-500" : "bg-gray-100"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">
                  {password.length < 8 ? "At least 8 characters" :
                   !/[A-Z]/.test(password) ? "Add an uppercase letter" :
                   !/[0-9]/.test(password) ? "Add a number" :
                   !/[^A-Za-z0-9]/.test(password) ? "Add a special character (optional)" :
                   "Strong password ✓"}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Reset password
            </button>

            <button
              type="button"
              onClick={() => setStep("otp")}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors mx-auto"
            >
              <ArrowLeft className="w-3 h-3" /> Back to code
            </button>
          </form>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="space-y-3">
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Sign in with new password
            </button>
          </div>
        )}

        {/* Footer */}
        {step !== "done" && (
          <p className="text-center text-sm text-gray-400 mt-6">
            <Link href="/login" className="flex items-center justify-center gap-1 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}