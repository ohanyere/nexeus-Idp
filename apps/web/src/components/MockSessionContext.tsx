"use client";

import { mockTenantTeams, rolePermissions } from "@/lib/mock-data";
import type { MockRole, Permission } from "@/lib/mock-data";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type MockSessionContextValue = {
 selectedTeamId: string;
 selectedTeam: typeof mockTenantTeams[number];
 setSelectedTeamId: (teamId: string) => void;
 selectedRole: MockRole;
 setSelectedRole: (role: MockRole) => void;
 can: (permission: Permission) => boolean;
};

const MockSessionContext = createContext<MockSessionContextValue | null>(null);

export function MockSessionProvider({ children }: { children: ReactNode }) {
 const [selectedTeamId, setSelectedTeamId] = useState(mockTenantTeams[0].id);
 const [selectedRole, setSelectedRole] = useState<MockRole>("Platform Admin");

 const selectedTeam = mockTenantTeams.find((team) => team.id === selectedTeamId) ?? mockTenantTeams[0];

 const value = useMemo<MockSessionContextValue>(() => ({
 selectedTeamId,
 selectedTeam,
 setSelectedTeamId,
 selectedRole,
 setSelectedRole,
 can: (permission: Permission) => rolePermissions[selectedRole].includes(permission)
 }), [selectedRole, selectedTeam, selectedTeamId]);

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
