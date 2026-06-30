"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
 const { session, sessionReady } = useMockSession();
 const pathname = usePathname();
 const router = useRouter();

 useEffect(() => {
 if (sessionReady && !session.authenticated) {
 router.replace(`/login?next=${encodeURIComponent(pathname)}`);
 }
 }, [pathname, router, session.authenticated, sessionReady]);

 if (!sessionReady || !session.authenticated) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-sm font-medium text-muted">
 Checking session...
 </div>
 );
 }

 return children;
}
