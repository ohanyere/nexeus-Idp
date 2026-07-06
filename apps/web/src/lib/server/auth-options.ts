import "server-only";

import type { NextAuthOptions } from "next-auth";
import GitHubProvider, { type GithubEmail, type GithubProfile } from "next-auth/providers/github";

import { findMockUserForIdentity } from "@/lib/auth";
import { getAuthMode } from "@/lib/auth-mode";

const defaultGitHubOAuthTimeoutMs = 10_000;

function getGitHubOAuthTimeoutMs() {
  const raw = process.env.AUTH_GITHUB_OAUTH_TIMEOUT_MS;

  if (!raw) {
    return defaultGitHubOAuthTimeoutMs;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultGitHubOAuthTimeoutMs;
  }

  return Math.trunc(parsed);
}

const githubOAuthTimeoutMs = getGitHubOAuthTimeoutMs();

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.AUTH_SECRET,
  providers: getAuthMode() === "github"
    ? [
        GitHubProvider({
          clientId: process.env.AUTH_GITHUB_ID ?? "",
          clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
          checks: ["state"],
          httpOptions: {
            timeout: githubOAuthTimeoutMs
          },
          userinfo: {
            url: "https://api.github.com/user",
            async request({ client, tokens }) {
              const accessToken = tokens.access_token;

              if (!accessToken) {
                throw new Error("GitHub OAuth response did not include an access token.");
              }

              const profile = await client.userinfo<GithubProfile>(accessToken);

              if (!profile.email) {
                try {
                  const res = await fetch("https://api.github.com/user/emails", {
                    headers: {
                      Authorization: `token ${accessToken}`
                    },
                    signal: AbortSignal.timeout(githubOAuthTimeoutMs)
                  });

                  if (res.ok) {
                    const emails = (await res.json()) as GithubEmail[];
                    profile.email = (emails.find((email) => email.primary) ?? emails[0])?.email ?? null;
                  }
                } catch (error) {
                  console.warn("GitHub OAuth email lookup failed; continuing with profile response.", {
                    error: error instanceof Error ? error.message : "Unknown GitHub email lookup error."
                  });
                }
              }

              return profile;
            }
          }
        })
      ]
    : [],
  callbacks: {
    jwt({ token, user }) {
      const mappedUser = findMockUserForIdentity({
        name: user?.name ?? token.name,
        email: user?.email ?? token.email,
        image: user?.image ?? token.picture
      });

      token.mockUserId = mappedUser.id;
      token.role = mappedUser.role;
      token.team = mappedUser.team;
      token.teamId = mappedUser.teamId;
      token.permissions = mappedUser.permissions;
      token.environmentAccess = mappedUser.environmentAccess;

      return token;
    },
    session({ session, token }) {
      const mappedUser = findMockUserForIdentity({
        name: session.user?.name ?? token.name,
        email: session.user?.email ?? token.email,
        image: session.user?.image ?? token.picture
      });

      if (session.user) {
        session.user.mockUserId = typeof token.mockUserId === "string" ? token.mockUserId : mappedUser.id;
        session.user.role = typeof token.role === "string" ? token.role : mappedUser.role;
        session.user.team = typeof token.team === "string" ? token.team : mappedUser.team;
        session.user.teamId = typeof token.teamId === "string" ? token.teamId : mappedUser.teamId;
        session.user.permissions = Array.isArray(token.permissions) ? token.permissions : mappedUser.permissions;
        session.user.environmentAccess = Array.isArray(token.environmentAccess) ? token.environmentAccess : mappedUser.environmentAccess;
        session.user.avatar = mappedUser.avatar;
      }

      return session;
    }
  }
};
