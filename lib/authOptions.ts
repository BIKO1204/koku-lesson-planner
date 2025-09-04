// /lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
};

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // App Router では必須ではないが、Vercel 本番では指定推奨
  // NEXTAUTH_URL: https://your-domain.vercel.app
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // 必要に応じて authorization パラメータを追加
      // authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } }
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // 初回サインイン時 or 更新時に admin フラグを付与
      const email = (token?.email ||
        (profile as any)?.email ||
        (account as any)?.email) as string | undefined;

      token.role = isAdminEmail(email) ? "admin" : "user";
      token.admin = token.role === "admin";
      return token;
    },
    async session({ session, token }) {
      // session.user.role / session.user.admin をクライアントでも使えるように出す
      (session.user as any).role = token.role;
      (session.user as any).admin = token.admin;
      return session;
    },
  },
};

export default authOptions;
