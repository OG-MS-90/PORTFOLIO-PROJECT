"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/authClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Read token from the URL on the client side to avoid Next.js
    // prerender issues with useSearchParams.
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token);
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
