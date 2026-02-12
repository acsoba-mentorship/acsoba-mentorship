import { auth0 } from "@/lib/auth0";
import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import Profile from "@/components/Profile";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 rounded-3xl bg-slate-800/80 p-8 shadow-2xl ring-1 ring-white/5">
        <img
          src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png"
          alt="Auth0 Logo"
          className="h-10 w-auto"
        />
        <h1 className="text-center text-3xl font-bold text-slate-100 md:text-4xl">
          Next.js + Auth0
        </h1>

        <div className="flex w-full flex-col items-center gap-8 rounded-2xl bg-slate-700/50 p-8 shadow-xl">
          {session ? (
            <div className="flex w-full flex-col items-center gap-6">
              <p className="text-lg font-semibold text-emerald-400">
                ✅ Successfully logged in!
              </p>
              <Profile />
              <LogoutButton />
            </div>
          ) : (
            <>
              <p className="text-center text-lg text-slate-300">
                Welcome! Please log in to access your protected content.
              </p>
              <LoginButton />
            </>
          )}
        </div>
      </div>
    </div>
  );
}