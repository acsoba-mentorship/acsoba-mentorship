"use client";

import { useAuth0 } from "@auth0/auth0-react";

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2363b3ed'/%3E%3Cpath d='M50 45c7.5 0 13.64-6.14 13.64-13.64S57.5 17.72 50 17.72s-13.64 6.14-13.64 13.64S42.5 45 50 45zm0 6.82c-9.09 0-27.28 4.56-27.28 13.64v3.41c0 1.88 1.53 3.41 3.41 3.41h47.74c1.88 0 3.41-1.53 3.41-3.41v-3.41c0-9.08-18.19-13.64-27.28-13.64z' fill='%23fff'/%3E%3C/svg%3E";

export default function Profile() {
  const { user, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-700/50 p-8 text-center shadow-xl">
        <div className="text-lg font-medium text-slate-400 animate-pulse">
          Loading user profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-center gap-8 rounded-2xl bg-slate-700/50 p-8 shadow-xl">
      <img
        src={user.picture || defaultAvatar}
        alt={user.name || "User profile"}
        className="h-28 w-28 rounded-full object-cover transition-transform hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = defaultAvatar;
        }}
      />
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-100">
          {user.name ?? "User"}
        </h2>
        <p className="text-slate-300">{user.email}</p>
      </div>
    </div>
  );
}