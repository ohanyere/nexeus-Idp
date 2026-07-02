import type { EnvironmentName, MockRole, Permission } from "@/lib/mock-data";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      mockUserId: string;
      role: MockRole;
      team: string;
      teamId: string;
      permissions: Permission[];
      environmentAccess: EnvironmentName[];
      avatar: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    mockUserId?: string;
    role?: MockRole;
    team?: string;
    teamId?: string;
    permissions?: Permission[];
    environmentAccess?: EnvironmentName[];
  }
}
