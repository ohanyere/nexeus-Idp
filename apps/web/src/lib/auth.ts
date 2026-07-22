import { deployments, rolePermissions, services, teams } from "@/lib/mock-data";
import type { EnvironmentName, MockRole, Permission } from "@/lib/mock-data";

export type AuthProviderId = "github" | "google" | "microsoft" | "email";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  team: string;
  teamId: string;
  role: MockRole;
  permissions: Permission[];
  environmentAccess: EnvironmentName[];
  timeZone: string;
  status: "Active" | "Away" | "Pending";
  lastActive: string;
};

export type ExternalAuthIdentity = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type MockAuthSession = {
  user: AuthenticatedUser;
  authenticated: boolean;
  provider: AuthProviderId;
  expires: string;
};

export type StoredMockSession = {
  userId: string;
  provider: AuthProviderId;
};

export type TeamMember = AuthenticatedUser & {
  slack: string;
};

export type TeamProfile = {
  id: string;
  name: string;
  owner: string;
  slackChannel: string;
  githubOrganization: string;
  costCenter: string;
  environmentAccess: EnvironmentName[];
  members: TeamMember[];
  ownedServiceIds: string[];
};

export type MockNotification = {
  id: string;
  category: "Deployment" | "Approval" | "Rollback" | "Policy" | "Invitation";
  title: string;
  detail: string;
  time: string;
  status: "Unread" | "Read";
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  scope: string;
  created: string;
  lastUsed: string;
  status: "Active" | "Rotating";
};

export const authProviders = [
  { id: "github" as const, label: "Continue with GitHub" },
  { id: "google" as const, label: "Continue with Google" },
  { id: "microsoft" as const, label: "Continue with Microsoft" }
];

const mockGitHubOwner = process.env.NEXT_PUBLIC_GITHUB_ORG || process.env.NEXT_PUBLIC_GITHUB_OWNER || process.env.GITHUB_ORG || process.env.GITHUB_OWNER || "github-owner-not-configured";

export const mockUsers: AuthenticatedUser[] = [
  user("user-avery", "Avery Morgan", "avery.morgan@example.com", "Platform Admin", "platform-engineering", ["dev", "stage", "prod"], "Active", "4 min ago"),
  user("user-jordan", "Jordan Lee", "jordan.lee@example.com", "Platform Engineer", "platform-engineering", ["dev", "stage", "prod"], "Active", "18 min ago"),
  user("user-maya", "Maya Chen", "maya.chen@example.com", "Team Lead", "payments", ["dev", "stage", "prod"], "Active", "8 min ago"),
  user("user-nora", "Nora Ali", "nora.ali@example.com", "Developer", "commerce", ["dev", "stage"], "Away", "2 hrs ago"),
  user("user-sam", "Sam Rivera", "sam.rivera@example.com", "Viewer", "developer-experience", ["dev"], "Pending", "1 day ago")
];

export const teamProfiles: TeamProfile[] = teams.map((team) => {
  const members = mockUsers.filter((member) => member.teamId === team.id);

  return {
    id: team.id,
    name: team.name,
    owner: members.find((member) => member.role === "Team Lead" || member.role === "Platform Admin")?.name ?? `${team.name} Lead`,
    slackChannel: `#${team.id}`,
    githubOrganization: mockGitHubOwner,
    costCenter: `CC-${team.id.slice(0, 4).toUpperCase()}-${team.members}`,
    environmentAccess: team.name === "Developer Experience" ? ["dev", "stage"] : ["dev", "stage", "prod"],
    members: members.map((member) => ({ ...member, slack: `@${member.name.toLowerCase().replaceAll(" ", ".")}` })),
    ownedServiceIds: services.filter((service) => service.teamId === team.id).map((service) => service.id)
  };
});

export const mockNotifications: MockNotification[] = [
  { id: "notif-deploy", category: "Deployment", title: "Payments API production healthy", detail: "Rollout completed after PR #142 merged.", time: "47 min ago", status: "Unread" },
  { id: "notif-approval", category: "Approval", title: "Checkout stage promotion waiting", detail: "Team Lead approval is required before merge.", time: "2 hrs ago", status: "Unread" },
  { id: "notif-rollback", category: "Rollback", title: "Checkout rollback requested", detail: "Rollback target v2.7.1 is ready for review.", time: "2 hrs ago", status: "Read" },
  { id: "notif-policy", category: "Policy", title: "Orders Worker labels failed", detail: "Required labels policy blocked stage rollout.", time: "3 hrs ago", status: "Unread" },
  { id: "notif-invite", category: "Invitation", title: "New team invitation prepared", detail: "Invitation prepared for commerce developer access.", time: "1 day ago", status: "Read" }
];

export const mockApiKeys: ApiKeyRecord[] = [
  { id: "key-cli", name: "Nexus CLI", scope: "services:read deployments:read", created: "2026-06-01", lastUsed: "12 min ago", status: "Active" },
  { id: "key-automation", name: "Team automation", scope: "services:create resources:read", created: "2026-05-20", lastUsed: "2 hrs ago", status: "Rotating" }
];

export const mockSessionStorageKey = "nexus-platform.mock-session";

export function createMockSession(userId = "user-avery", authenticated = true, provider: AuthProviderId = "email"): MockAuthSession {
  const user = mockUsers.find((candidate) => candidate.id === userId) ?? mockUsers[0];

  return {
    user,
    authenticated,
    provider,
    expires: "2026-07-01T00:00:00.000Z"
  };
}

export function findMockUserForIdentity(identity: ExternalAuthIdentity) {
  const email = identity.email?.trim().toLowerCase();

  if (email) {
    const emailMatch = mockUsers.find((user) => user.email.toLowerCase() === email);

    if (emailMatch) {
      return emailMatch;
    }
  }

  const name = identity.name?.trim().toLowerCase();

  if (name) {
    const nameMatch = mockUsers.find((user) => user.name.toLowerCase() === name);

    if (nameMatch) {
      return nameMatch;
    }
  }

  return mockUsers[0];
}

export function mapAuthIdentityToUser(identity: ExternalAuthIdentity): AuthenticatedUser {
  const mappedUser = findMockUserForIdentity(identity);
  const name = identity.name?.trim() || mappedUser.name;
  const email = identity.email?.trim() || mappedUser.email;

  return {
    ...mappedUser,
    name,
    email,
    avatar: initials(name),
    status: "Active",
    lastActive: "Now"
  };
}

export function activateMockSession(userId = "user-avery", provider: AuthProviderId = "email") {
  if (typeof window === "undefined") {
    return;
  }

  const session: StoredMockSession = { userId, provider };
  window.localStorage.setItem(mockSessionStorageKey, JSON.stringify(session));
}

export function readStoredMockSession(): StoredMockSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(mockSessionStorageKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredMockSession>;

    if (!parsed.userId || !parsed.provider) {
      return null;
    }

    return {
      userId: parsed.userId,
      provider: parsed.provider
    };
  } catch {
    return null;
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(mockSessionStorageKey);
}

export function getTeamProfile(teamId: string) {
  return teamProfiles.find((team) => team.id === teamId);
}

export function getPersonalDashboard(user: AuthenticatedUser) {
  const myServices = services.filter((service) => service.teamId === user.teamId || service.serviceOwner === user.name);
  const pendingPromotions = deployments.filter((deployment) => ["warning", "info", "drift"].includes(deployment.tone));
  const pendingRollbacks = deployments.filter((deployment) => deployment.status.toLowerCase().includes("rollback"));
  const recentDeployments = deployments.filter((deployment) => user.environmentAccess.includes(deployment.environment)).slice(0, 5);

  return {
    myServices,
    myTeams: teamProfiles.filter((team) => team.id === user.teamId),
    pendingPromotions,
    pendingRollbacks,
    recentDeployments,
    notifications: mockNotifications
  };
}

function user(
  id: string,
  name: string,
  email: string,
  role: MockRole,
  teamId: string,
  environmentAccess: EnvironmentName[],
  status: AuthenticatedUser["status"],
  lastActive: string
): AuthenticatedUser {
  const team = teams.find((candidate) => candidate.id === teamId);

  return {
    id,
    name,
    email,
    avatar: initials(name),
    team: team?.name ?? "Platform Team",
    teamId,
    role,
    permissions: rolePermissions[role],
    environmentAccess,
    timeZone: "America/Los_Angeles",
    status,
    lastActive
  };
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
