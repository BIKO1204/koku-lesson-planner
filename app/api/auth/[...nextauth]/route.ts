import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

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
    // リフレッシュ失敗はエラーとして返す
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
          access_type: "offline",  // リフレッシュトークン取得必須
          prompt: "consent",       // 毎回同意を得る
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, user }: { token: JWT; account?: any | null; user?: AdapterUser | null }): Promise<JWT> {
      // 初回ログイン時
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
          user,
        };
      }

      // トークン有効期限内ならそのまま返す
      const expires = typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : 0;
      if (Date.now() < expires) {
        return token;
      }

      // 期限切れなら更新試行
      return await refreshAccessToken(token);
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      (session as any).accessToken = token.accessToken;
      (session as any).error = (token as any).error;
      return session;
    },
  },
};

// 動的にNextAuthをimportしてハンドラ返却
async function getHandler() {
  if (!NextAuthHandler) {
    const mod = await import("next-auth");
    NextAuthHandler = mod.default;
  }
  return NextAuthHandler(authOptions);
}

export async function GET(req: Request, res: Response) {
  const handler = await getHandler();
  return handler(req, res);
}

export async function POST(req: Request, res: Response) {
  const handler = await getHandler();
  return handler(req, res);
}
