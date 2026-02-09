import type { UserWithProfiles } from "@/lib/types";

export type UserRole = "mentee" | "mentor";

export function hasMenteeProfile(user: UserWithProfiles | undefined): boolean {
  return Boolean(user?.menteeProfile);
}

export function hasMentorProfile(user: UserWithProfiles | undefined): boolean {
  return Boolean(user?.mentorProfile);
}

export function getActiveRoles(user: UserWithProfiles | undefined): UserRole[] {
  const roles: UserRole[] = [];

  if (hasMenteeProfile(user)) {
    roles.push("mentee");
  }

  if (hasMentorProfile(user)) {
    roles.push("mentor");
  }

  return roles;
}

export function getInitialRoleTab(user: UserWithProfiles | undefined): UserRole | undefined {
  const roles = getActiveRoles(user);
  return roles[0];
}

