import React, { useState } from "react";
import { supabase, isMockClient } from "../supabase";
import { useToast } from "./Toast";
import { KeyRound, Mail, Sparkles, Terminal, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { CodeSapiensBanner, CodeSapiensCrowd } from "./CodeSapiensLogo";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

type AuthMode = "signin" | "signup" | "magiclink";

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Please enter an email address.", "error");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          showToast("Password must be at least 6 characters.", "error");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          showToast(error.message, "error");
        } else {
          showToast("Sign up successful! Welcome to CodeSapiens Alumni Meetup.", "success");
          onAuthSuccess();
        }
      } else if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showToast(error.message, "error");
        } else {
          showToast("Successfully signed in!", "success");
          onAuthSuccess();
        }
      } else if (mode === "magiclink") {
        const { data, error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          showToast(error.message, "error");
        } else {
          if (isMockClient) {
            showToast("Magic Link Mode: Signed in instantly for preview!", "success");
            onAuthSuccess();
          } else {
            showToast("Magic Link link sent! Check your inbox.", "success");
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || "An unexpected auth error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sunburst flex flex-col items-center justify-between px-4 pt-10 overflow-x-hidden">
      {/* CodeSapiens Branding Headers */}
      <div className="w-full max-w-lg">
        <CodeSapiensBanner />
      </div>

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="max-w-md w-full space-y-6 glow-card p-6 sm:p-8 rounded-2xl shadow-2xl relative z-20 my-6 border border-brand-neon/10"
      >
        {/* Mock Mode Alert Banner */}
        {isMockClient && (
          <div className="bg-brand-neon/10 border border-brand-neon/30 rounded-xl p-3 text-xs text-brand-neon flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-neon shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold">Sandbox Mode:</span> Database is running in local memory. Enter any email & password to test immediately!
            </div>
          </div>
        )}

        {/* Mode Toggles */}
        <div className="flex border-b border-white/5 pb-1">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 text-center py-2.5 text-xs font-display font-bold uppercase tracking-wider border-b-2 transition-all ${
              mode === "signin"
                ? "border-brand-neon text-brand-neon"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 text-center py-2.5 text-xs font-display font-bold uppercase tracking-wider border-b-2 transition-all ${
              mode === "signup"
                ? "border-brand-neon text-brand-neon"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setMode("magiclink")}
            className={`flex-1 text-center py-2.5 text-xs font-display font-bold uppercase tracking-wider border-b-2 transition-all ${
              mode === "magiclink"
                ? "border-brand-neon text-brand-neon"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Auth Form */}
        <form className="space-y-4" onSubmit={handleAuth}>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coder@codesapiens.com"
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {mode !== "magiclink" && (
            <div>
              <label className="block text-[10px] font-display font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
                />
              </div>
              {mode === "signin" && (
                <p className="text-right text-[11px] text-brand-neon hover:underline cursor-pointer mt-2 font-medium">
                  Forgot your password?
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1D9E75] hover:bg-[#22C55E] text-white font-display font-bold uppercase tracking-wide rounded-xl text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-6 border-b-4 border-emerald-800"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {mode === "signin" ? "Enter Meetup" : mode === "signup" ? "Join Community" : "Send Magic Link"}
                <ArrowRight className="w-4 h-4 text-brand-neon" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-400 pt-1 font-medium leading-relaxed">
          Reconnect with coders, reminisce the hackathons, and shape the future of CodeSapiens.
        </div>
      </motion.div>

      {/* CodeSapiens crowd silhouette at the footer */}
      <CodeSapiensCrowd />
    </div>
  );
}

