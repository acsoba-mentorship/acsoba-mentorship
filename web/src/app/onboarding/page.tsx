import { redirect } from "next/navigation";
import { ONBOARDING_START_PATH } from "@/lib/onboarding";

export default function OnboardingPage() {
  redirect(ONBOARDING_START_PATH);
}
