"use client";

import { createMockSession, mockUsers } from "@/lib/auth";
import type { AuthenticatedUser, MockAuthSession } from "@/lib/auth";
import { rolePermissions, teams } from "@/lib/mock-data";
import type { MockRole, Permission } from "@/lib/mock-data";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type MockSessionContextValue = {
 selectedTeamId: string;
 selectedTeam: typeof teams[number];
 setSelectedTeamId: (teamId: string) => void;
 selectedRole: MockRole;
 setSelectedRole: (role: MockRole) => void;
 session: MockAuthSession;
 user: AuthenticatedUser;
 users: AuthenticatedUser[];
 setUserId: (userId: string) => void;
 signOut: () => void;
 can: (permission: Permission) => boolean;
};

const MockSessionContext = createContext<MockSessionContextValue | null>(null);

export function MockSessionProvider({ children }: { children: ReactNode }) {
 const [selectedUserId, setUserId] = useState("user-avery");
 const baseSession = createMockSession(selectedUserId);
 const [selectedTeamId, setSelectedTeamId] = useState(baseSession.user.teamId);
 const [selectedRole, setSelectedRole] = useState<MockRole>(baseSession.user.role);

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
 user,
 users: mockUsers,
 setUserId,
 signOut: () => undefined,
 can: (permission: Permission) => rolePermissions[selectedRole].includes(permission)
 }), [selectedRole, selectedTeam, selectedTeamId, session, user]);

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
