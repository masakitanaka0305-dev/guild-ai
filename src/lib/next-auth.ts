import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const hasGithub = !!process.env.GITHUB_CLIENT_ID && process.env.MOCK_GITHUB !== "true";
const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && process.env.MOCK_GOOGLE !== "true";

export const isMockGithub = !hasGithub;
export const isMockGoogle = !hasGoogle;

export const authOptions: NextAuthOptions = {
  providers: [
    ...(hasGithub ? [GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user repo" } },
    })] : []),
    ...(hasGoogle ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { scope: "openid email profile" } },
    })] : []),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-not-for-production",
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      if (profile) {
        // GitHub: profile.login. Google: profile.email/name
        const p = profile as { login?: string; email?: string; name?: string; given_name?: string; family_name?: string };
        if (p.login) token.githubLogin = p.login;
        if (p.given_name) token.firstName = p.given_name;
        if (p.family_name) token.lastName = p.family_name;
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as typeof session & { accessToken?: string; provider?: string; githubLogin?: string; firstName?: string; lastName?: string };
      s.accessToken = token.accessToken as string | undefined;
      s.provider = token.provider as string | undefined;
      s.githubLogin = token.githubLogin as string | undefined;
      s.firstName = token.firstName as string | undefined;
      s.lastName = token.lastName as string | undefined;
      return s;
    },
  },
};
