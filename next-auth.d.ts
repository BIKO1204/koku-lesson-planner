// next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    /** Google OAuth の access_token を保持 */
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** OAuth コールバックでセットする access_token */
    accessToken: string;
  }
}
