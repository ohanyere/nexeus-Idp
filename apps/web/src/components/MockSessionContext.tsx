"use client";

import { clearMockSession, createMockSession, mapAuthIdentityToUser, mockUsers, readStoredMockSession } from "@/lib/auth";
import type { AuthenticatedUser, AuthProviderId, MockAuthSession } from "@/lib/auth";
import { getAuthMode } from "@/lib/auth-mode";
import { rolePermissions, teams } from "@/lib/mock-data";
import type { MockRole, Permission } from "@/lib/mock-data";
import { SessionProvider, signOut as signOutAuth, useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type MockSessionContextValue = {
 selectedTeamId: string;
 selectedTeam: typeof teams[number];
 setSelectedTeamId: (teamId: string) => void;
 selectedRole: MockRole;
 setSelectedRole: (role: MockRole) => void;
 session: MockAuthSession;
 sessionReady: boolean;
 user: AuthenticatedUser;
 users: AuthenticatedUser[];
 setUserId: (userId: string) => void;
 signOut: () => void;
 can: (permission: Permission) => boolean;
};

const MockSessionContext = createContext<MockSessionContextValue | null>(null);

export function MockSessionProvider({ children }: { children: ReactNode }) {
 return (
 <SessionProvider refetchOnWindowFocus={false}>
 <SessionContextBridge>{children}</SessionContextBridge>
 </SessionProvider>
 );
}

function SessionContextBridge({ children }: { children: ReactNode }) {
 const authMode = getAuthMode();
 const nextAuthSession = useSession();
 const [selectedUserId, setUserId] = useState("user-avery");
 const [authenticated, setAuthenticated] = useState(false);
 const [provider, setProvider] = useState<AuthProviderId>("email");
 const [sessionReady, setSessionReady] = useState(false);
 const [selectedTeamId, setSelectedTeamId] = useState("platform-engineering");
 const [selectedRole, setSelectedRole] = useState<MockRole>("Platform Admin");
 const authUser = useMemo(() => {
 if (authMode !== "github" || !nextAuthSession.data?.user) {
  return null;
 }

 return mapAuthIdentityToUser(nextAuthSession.data.user);
 }, [authMode, nextAuthSession.data?.user]);
 const baseSession = createMockSession(authUser?.id ?? selectedUserId, authMode === "github" ? nextAuthSession.status === "authenticated" : authenticated, authMode === "github" ? "github" : provider);

 useEffect(() => {
 if (authMode === "github") {
  if (nextAuthSession.status === "authenticated" && authUser) {
  setUserId(authUser.id);
  setSelectedTeamId(authUser.teamId);
  setSelectedRole(authUser.role);
  setAuthenticated(true);
  setProvider("github");
  }

  if (nextAuthSession.status === "unauthenticated") {
  setAuthenticated(false);
  }

  setSessionReady(nextAuthSession.status !== "loading");
  return;
 }

 const stored = readStoredMockSession();

 if (stored) {
  const storedSession = createMockSession(stored.userId, true, stored.provider);
  setUserId(stored.userId);
  setProvider(stored.provider);
  setSelectedTeamId(storedSession.user.teamId);
  setSelectedRole(storedSession.user.role);
  setAuthenticated(true);
 }

 setSessionReady(true);
 }, [authMode, authUser, nextAuthSession.status]);

 const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];
 const user = useMemo<AuthenticatedUser>(() => ({
 ...baseSession.user,
 team: selectedTeam.name,
 teamId: selectedTeam.id,
 role: selectedRole,
 permissions: rolePermissions[selectedRole]
 }), [baseSession.user, selectedRole, selectedTeam]);
 const session = useMemo<MockAuthSession>(() => ({
 ...baseSession,
 user
 }), [baseSession, user]);

 const value = useMemo<MockSessionContextValue>(() => ({
 selectedTeamId,
 selectedTeam,
 setSelectedTeamId,
 selectedRole,
 setSelectedRole,
 session,
 sessionReady,
 user,
 users: mockUsers,
 setUserId,
 signOut: () => {
  if (authMode === "github") {
  void signOutAuth({ callbackUrl: "/login" });
  return;
  }

  clearMockSession();
  setAuthenticated(false);
  if (typeof window !== "undefined") {
  window.location.assign("/login");
  }
 },
 can: (permission: Permission) => rolePermissions[selectedRole].includes(permission)
 }), [authMode, selectedRole, selectedTeam, selectedTeamId, session, sessionReady, user]);

 return (
 <MockSessionContext.Provider value={value}>
 {children}
 </MockSessionContext.Provider>
 );
}

export function useMockSession() {
 const context = useContext(MockSessionContext);

 if (!context) {
 throw new Error("useMockSession must be used within MockSessionProvider");
 }

 return context;
}
