import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebaseAdmin";

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
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  // 原因調査が終わったら false に戻してOK
  debug: true,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
      await adminDb.collection("users").doc(user.id).set(
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
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          accessToken: (account as any).access_token,
          refreshToken: (account as any).refresh_token,
          accessTokenExpires: ((account as any).expires_at ?? 0) * 1000,
          userId: (user as any).id ?? token.sub,
        };
      }
      const exp = typeof (token as any).accessTokenExpires === "number" ? (token as any).accessTokenExpires : 0;
      if (Date.now() < exp) return token;
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).error = (token as any).error;
      (session as any).userId = (token as any).userId ?? token.sub;
      return session;
    },
  },
};
