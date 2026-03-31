"use client";

import { createClient } from "@/lib/supabase";

interface LoginProps {
  darkMode: boolean;
}

export default function Login({ darkMode }: LoginProps) {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 p-2.5">
            <img src="/ryzlabs-logo.svg" alt="RyzLabs" className="w-full h-full" />
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Radar</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Sign in with your RyzLabs account</p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 ${
            darkMode
              ? "bg-white text-slate-800 hover:bg-slate-100"
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <p className={`text-xs text-center mt-6 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
          Only @ryzlabs.com accounts are allowed
        </p>
      </div>
    </div>
  );
}
