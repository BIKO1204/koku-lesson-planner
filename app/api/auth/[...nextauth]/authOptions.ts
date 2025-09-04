// app/api/auth/[...nextauth]/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebaseAdmin";

const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
};

async function refreshAccessToken(token: any) {
  if (!token?.refreshToken) return { ...token, error: "NoRefreshToken" as const };
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: String(token.refreshToken),
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ...token, error: "RefreshAccessTokenError" as const };
  return {
    ...token,
    accessToken: data.access_token,
    accessTokenExpires: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token ?? token.refreshToken,
    error: undefined,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile", // Drive 連携不要なら最小に
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
      await getAdminDb()
        .collection("users")
        .doc(user.id)
        .set(
          {
            email: user.email,
            name: user.name,
            image: user.image,
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      return true;
    },
    async jwt({ token, account, user, profile }) {
      if (account && user) {
        const email =
          user.email ?? (profile as any)?.email ?? token.email ?? null;
        return {
          ...token,
          accessToken: (account as any).access_token,
          refreshToken: (account as any).refresh_token,
          accessTokenExpires: ((account as any).expires_at ?? 0) * 1000,
          userId: (user as any).id ?? token.sub,
          admin: isAdminEmail(email),
          role: isAdminEmail(email) ? "admin" : "user",
        };
      }
      const exp = typeof (token as any).accessTokenExpires === "number"
        ? (token as any).accessTokenExpires
        : 0;
      if (Date.now() < exp) return token;
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).error = (token as any).error;
      (session as any).userId = (token as any).userId ?? token.sub;
      (session.user as any).admin = (token as any).admin === true;
      (session.user as any).role = (token as any).role ?? "user";
      return session;
    },
  },
};
