export const runtime = "nodejs"; // ← これを最初に追加！

import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// --- firebase-admin の初期化 ---
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
// --------------------------------

let NextAuthHandler: any; // 動的ロード用

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
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
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
      // Firestore (firebase-admin)でユーザー登録/更新
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
      token: JWT;
      account?: any | null;
      user?: AdapterUser | null;
    }): Promise<JWT> {
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
        typeof token.accessTokenExpires === "number"
          ? token.accessTokenExpires
          : 0;

      if (Date.now() < expires) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      (session as any).accessToken = token.accessToken;
      (session as any).error = (token as any).error;
      return session;
    },
  },
};

// --- NextAuthの動的インポート ---
async function getHandler() {
  if (!NextAuthHandler) {
    const mod = await import("next-auth");
    NextAuthHandler = mod.default;
  }
  return NextAuthHandler(authOptions);
}

// Next.js 13 Route Handler（resは渡さない！）
export async function GET(req: Request) {
  const handler = await getHandler();
  return handler(req);
}

export async function POST(req: Request) {
  const handler = await getHandler();
  return handler(req);
}
