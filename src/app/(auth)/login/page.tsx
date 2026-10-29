import type { Metadata } from "next";

import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — GitHub Monitor",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const { redirect } = await searchParams;
  return <LoginForm redirectTo={safeRedirectPath(redirect) ?? undefined} />;
}
