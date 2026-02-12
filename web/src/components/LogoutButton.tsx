"use client";

export default function LogoutButton() {
  return (
    <a
      href="/auth/logout"
      className="rounded-xl bg-red-400 px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-red-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-400/50"
    >
      Log Out
    </a>
  );
}