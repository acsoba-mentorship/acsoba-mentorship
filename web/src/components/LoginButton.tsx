"use client";

import { useAuth0 } from "@auth0/auth0-react";

export default function LoginButton() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = () => {
    if (isLoading) return;
    void loginWithRedirect();
  };

  const handleSignup = () => {
    if (isLoading) return;
    void loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  return (
    <div className="flex flex-wrap justify-center gap-4">
      <button
        type="button"
        onClick={handleSignup}
        className="rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
      >
        Sign Up
      </button>
      <button
        type="button"
        onClick={handleLogin}
        className="rounded-xl bg-sky-400 px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-sky-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-400/50"
      >
        Log In
      </button>
    </div>
  );
}