// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

// Google アクセストークンのリフレッシュ
async function refreshAccessToken(token: any): Promise<any> {
  const refreshToken = token?.refreshToken as string | undefined;
  if (!refreshToken) {
    return { ...token, error: "NoRefreshToken" };
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const refreshed = await res.json();
  if (!res.ok) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  return {
    ...token,
    accessToken: refreshed.access_token,
    accessTokenExpires: Date.now() + (refreshed.expires_in ?? 0) * 1000,
    refreshToken: refreshed.refresh_token ?? refreshToken,
    error: undefined,
  };
}

export const authOptions: any = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }: { user: any }) {
      if (!user?.id) return false;
      const ref = adminDb.collection("users").doc(user.id);
      await ref.set(
        {
          email: user.email ?? "",
          name: user.name ?? "",
          image: user.image ?? "",
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    },

    async jwt({
      token,
      account,
      user,
    }: {
      token: any;
      account?: any | null;
      user?: any | null;
    }): Promise<any> {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
          user,
        };
      }
      const expires =
        typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : 0;
      if (Date.now() < expires) return token;
      return await refreshAccessToken(token);
    },

    async session({ session, token }: { session: any; token: any }): Promise<any> {
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.userId = token.sub; // Google の sub（不変）
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
