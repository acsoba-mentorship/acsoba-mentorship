"use client";

export default function LoginButton() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <a
        href="/auth/login?screen_hint=signup"
        className="rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
      >
        Sign Up
      </a>
      <a
        href="/auth/login"
        className="rounded-xl bg-sky-400 px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-sky-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-400/50"
      >
        Log In
      </a>
    </div>
  );
}