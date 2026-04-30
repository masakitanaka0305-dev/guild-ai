import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const isMockMode = !process.env.GITHUB_CLIENT_ID || process.env.MOCK_GITHUB === "true";

export const authOptions: NextAuthOptions = {
  providers: isMockMode ? [] : [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user repo" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-not-for-production",
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};

export const isMockGithub = isMockMode;
