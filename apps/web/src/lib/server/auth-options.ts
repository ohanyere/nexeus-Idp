import "server-only";

import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { findMockUserForIdentity } from "@/lib/auth";
import { getAuthMode } from "@/lib/auth-mode";

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
          clientSecret: process.env.AUTH_GITHUB_SECRET ?? ""
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
