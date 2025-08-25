// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import admin from "firebase-admin";

// ★ ここを「一行JSON」方式に統一（環境変数1個で済む）
if (!admin.apps.length) {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(svc)),
  });
}
const firestore = admin.firestore();

async function refreshAccessToken(token: any) {
  if (!token.refreshToken) throw new Error("No refresh token available");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: String(token.refreshToken),
    }),
  });
  const refreshedTokens = await response.json();
  if (!response.ok) return { ...token, error: "RefreshAccessTokenError" as const };
  return {
    ...token,
    accessToken: refreshedTokens.access_token,
    accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    error: undefined,
  };
}

const handler = NextAuth({
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
  debug: true, // 一時的にON（原因特定用）

  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
      await firestore.collection("users").doc(user.id).set(
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
      const expires = typeof (token as any).accessTokenExpires === "number" ? (token as any).accessTokenExpires : 0;
      if (Date.now() < expires) return token;
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).error = (token as any).error;
      (session as any).userId = (token as any).userId ?? token.sub;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
