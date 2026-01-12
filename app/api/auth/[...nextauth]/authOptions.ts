// app/api/auth/[...nextauth]/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * ADMIN_EMAILS（任意）: "a@x.com,b@y.com"
 * Firebase custom claims admin:true がある場合は、こちらが無くても admin になります。
 */
const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
};

/**
 * Google OAuth の refresh token で access token を更新
 */
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

/**
 * Firebase custom claims から admin 判定（admin:true）
 * ※ getAdminDb() を呼んでおくことで admin SDK 初期化が担保されやすい
 */
async function isAdminByFirebaseClaims(uid?: string | null) {
  if (!uid) return false;

  try {
    // 初期化担保（プロジェクトの実装に依存）
    getAdminDb();

    const u = await admin.auth().getUser(uid);
    return u.customClaims?.admin === true;
  } catch {
    return false;
  }
}

/**
 * NextAuth
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile",
        },
      },
    }),
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",

  callbacks: {
    /**
     * ここでは user.id が無いケースがあるので、
     * Google の providerAccountId (= profile.sub) をUIDとして採用して統一します。
     */
    async signIn({ user, account, profile }) {
      const uid =
        account?.providerAccountId ??
        (profile as any)?.sub ??
        (user as any)?.id ??
        null;

      if (!uid) return false;

      await getAdminDb()
        .collection("users")
        .doc(uid)
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

    /**
     * JWTに、admin/role/userId/accessToken 等を載せる
     */
    async jwt({ token, account, user, profile }) {
      // UIDを一貫させる（Firebase UID と揃えたいので Google sub を優先）
      const uid =
        account?.providerAccountId ??
        (token as any)?.userId ??
        token.sub ??
        (profile as any)?.sub ??
        (user as any)?.id ??
        null;

      // 初回ログイン（account がある時）に admin 判定を確定させて token に載せる
      if (account && user) {
        const email =
          user.email ?? (profile as any)?.email ?? token.email ?? null;

        // ① メールallowlist（任意）
        const byEmail = isAdminEmail(email);

        // ② Firebase custom claims（admin:true）
        const byClaims = await isAdminByFirebaseClaims(uid);

        const isAdmin = byEmail || byClaims;

        return {
          ...token,
          accessToken: (account as any).access_token,
          refreshToken: (account as any).refresh_token,
          accessTokenExpires: ((account as any).expires_at ?? 0) * 1000,
          userId: uid,
          admin: isAdmin,
          role: isAdmin ? "admin" : "user",
        };
      }

      // 以降は通常リクエスト：期限内ならそのまま
      const exp =
        typeof (token as any).accessTokenExpires === "number"
          ? (token as any).accessTokenExpires
          : 0;

      if (Date.now() < exp) return token;

      // 期限切れなら refresh（admin/role は ...token で保持される）
      return await refreshAccessToken(token);
    },

    /**
     * session に token の値を載せる（middleware が見るのは token なのでここも整える）
     */
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).error = (token as any).error;

      (session as any).userId = (token as any).userId ?? token.sub;

      (session.user as any).admin = (token as any).admin === true;
      (session.user as any).role = (token as any).role ?? "user";

      return session;
    },
  },

  pages: { signIn: "/welcome" },
};
