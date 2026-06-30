"use client";

import { clearMockSession, createMockSession, mockUsers, readStoredMockSession } from "@/lib/auth";
import type { AuthenticatedUser, AuthProviderId, MockAuthSession } from "@/lib/auth";
import { rolePermissions, teams } from "@/lib/mock-data";
import type { MockRole, Permission } from "@/lib/mock-data";
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
 const [selectedUserId, setUserId] = useState("user-avery");
 const [authenticated, setAuthenticated] = useState(false);
 const [provider, setProvider] = useState<AuthProviderId>("email");
 const [sessionReady, setSessionReady] = useState(false);
 const baseSession = createMockSession(selectedUserId, authenticated, provider);
 const [selectedTeamId, setSelectedTeamId] = useState("platform-engineering");
 const [selectedRole, setSelectedRole] = useState<MockRole>("Platform Admin");

 useEffect(() => {
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
 }, []);

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
  clearMockSession();
  setAuthenticated(false);
  if (typeof window !== "undefined") {
  window.location.assign("/login");
  }
 },
 can: (permission: Permission) => rolePermissions[selectedRole].includes(permission)
 }), [selectedRole, selectedTeam, selectedTeamId, session, sessionReady, user]);

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
