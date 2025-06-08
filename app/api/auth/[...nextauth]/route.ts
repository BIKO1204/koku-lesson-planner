import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

let NextAuthHandler: any; // 後で動的にセット

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

  if (!response.ok) throw refreshedTokens;

  return {
    ...token,
    accessToken: refreshedTokens.access_token,
    accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
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
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({
      token,
      account,
      user,
    }: {
      token: JWT;
      account?: any | null;
      user?: AdapterUser | null;
    }): Promise<JWT> {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
          user,
        };
      }

      const expires = typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : 0;

      if (Date.now() < expires) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session(params: {
      session: Session;
      token: JWT;
      user: AdapterUser;
    }): Promise<Session> {
      const { session, token } = params;
      (session as any).accessToken = token.accessToken;
      (session as any).error = (token as any).error;
      return session;
    },
  },
};

// 動的に NextAuth をimportしてからエクスポートするハンドラを作る
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
