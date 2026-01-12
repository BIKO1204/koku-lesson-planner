// app/api/auth/[...nextauth]/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import admin from "firebase-admin";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

/**
 * 管理者判定（3段階）
 * 1) ADMIN_UIDS（最優先・最も確実）
 * 2) Firebase custom claims（admin:true）
 * 3) ADMIN_EMAILS（保険）
 */

const parseCsv = (v?: string | null) =>
  (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const ADMIN_UIDS = parseCsv(process.env.ADMIN_UIDS);
const ADMIN_EMAILS = parseCsv(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase());

const isAdminUid = (uid?: string | null) => !!uid && ADMIN_UIDS.includes(uid);
const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

async function isAdminByFirebaseClaims(uid?: string | null) {
  if (!uid) return false;
  try {
    const auth = getAdminAuth();
    const u = await auth.getUser(uid);
    return u.customClaims?.admin === true;
  } catch {
    return false;
  }
}

/** GoogleのUID（sub）を安定して取得 */
function pickUid({
  token,
  account,
  user,
  profile,
}: {
  token: any;
  account: any;
  user: any;
  profile: any;
}) {
  return (
    account?.providerAccountId ?? // Google sub（最優先）
    token?.userId ??
    token?.sub ??
    profile?.sub ??
    user?.id ??
    null
  );
}

/** access token refresh（Google） */
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
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",

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

  callbacks: {
    /**
     * callbackUrl 増殖(414)を止める
     */
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {}
      return `${baseUrl}/admin`;
    },

    /**
     * users に最終ログイン保存（UIDで統一）
     */
    async signIn({ user, account, profile }) {
      const uid = pickUid({ token: {}, account, user, profile });
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
     * token に admin/role/userId/accessToken を載せる
     */
    async jwt({ token, account, user, profile }) {
      const uid = pickUid({ token, account, user, profile });
      if (uid) (token as any).userId = uid;

      // 初回ログイン時（accountあり）に admin/role 確定
      if (account && user) {
        const email =
          user.email ?? (profile as any)?.email ?? (token as any)?.email ?? null;

        // 優先順位：UID allowlist ＞ Firebase claims ＞ Email allowlist
        const byUid = isAdminUid(uid);
        const byClaims = byUid ? true : await isAdminByFirebaseClaims(uid);
        const byEmail = byUid || byClaims ? true : isAdminEmail(email);

        const isAdmin = byUid || byClaims || byEmail;

        (token as any).accessToken = (account as any).access_token;
        (token as any).refreshToken = (account as any).refresh_token;
        (token as any).accessTokenExpires = ((account as any).expires_at ?? 0) * 1000;

        (token as any).admin = isAdmin;
        (token as any).role = isAdmin ? "admin" : "user";

        return token;
      }

      // 通常：期限内ならそのまま
      const exp =
        typeof (token as any).accessTokenExpires === "number"
          ? (token as any).accessTokenExpires
          : 0;

      if (Date.now() < exp) return token;

      // 期限切れなら refresh（admin/roleは保持される）
      return await refreshAccessToken(token);
    },

    /**
     * sessionへ反映
     */
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).error = (token as any).error;
      (session as any).userId = (token as any).userId ?? (token as any).sub;

      (session.user as any).admin = (token as any).admin === true;
      (session.user as any).role = (token as any).role ?? "user";

      return session;
    },
  },
};
