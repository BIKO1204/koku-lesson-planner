// lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // まずは JWT で安定運用（DB不要）
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    // session に email を必ず載せる（custom-token 側で使うため）
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email ?? undefined;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      // 初回ログイン時などに email を token に保持
      if (profile && "email" in profile && profile.email) token.email = profile.email;
      if (account?.provider) token.provider = account.provider;
      return token;
    },
  },

  // あるとデバッグしやすい
  // debug: process.env.NODE_ENV !== "production",
};
