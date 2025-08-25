// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";

import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const firestore = admin.firestore();

let NextAuthHandler: any;

async function refreshAccessToken(token: JWT): Promise<JWT> {
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
  if (!response.ok) {
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
  return {
    ...token,
    accessToken: refreshedTokens.access_token,
    accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    error: undefined,
  };
}

export const authOptions = {
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
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }: { user: AdapterUser }) {
      if (!user.id) return false;
      const userRef = firestore.collection("users").doc(user.id);
      await userRef.set(
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

    async jwt({
      token,
      account,
      user,
    }: {
      token: JWT & { userId?: string };
      account?: any | null;
      user?: AdapterUser | null;
    }): Promise<JWT & { userId?: string }> {
      if (account && user) {
        // Google の sub は token.sub に入る。安全のため userId にもコピー
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
          userId: (user as any).id ?? token.sub, // ★ ここが後続の custom-token で必要
        };
      }

      const expires =
        typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : 0;
      if (Date.now() < expires) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session({
      session,
      token,
    }: {
      session: Session & { userId?: string; error?: string; accessToken?: string };
      token: JWT & { userId?: string; accessToken?: string; error?: string };
    }): Promise<Session> {
      session.accessToken = token.accessToken as any;
      (session as any).error = (token as any).error;
      (session as any).userId = token.userId ?? token.sub; // ★ custom-token で参照
      return session;
    },
  },
};

async function getHandler() {
  if (!NextAuthHandler) {
    const mod = await import("next-auth");
    NextAuthHandler = mod.default;
  }
  return NextAuthHandler(authOptions);
}

export async function GET(req: Request) {
  const handler = await getHandler();
  return handler(req);
}

export async function POST(req: Request) {
  const handler = await getHandler();
  return handler(req);
}
