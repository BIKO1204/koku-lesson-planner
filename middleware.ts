// middleware.ts
import { withAuth } from "next-auth/middleware";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      if (!token) return false;

      const t: any = token;
      const email = (t.email || "").toLowerCase();

      const byRole = t.role === "admin" || t.admin === true;
      const byAllowlist = !!email && ADMIN_EMAILS.includes(email);

      return byRole || byAllowlist;
    },
  },
  // ★ここ重要：/welcome経由をやめてループ断ち
  pages: { signIn: "/api/auth/signin" },
});

export const config = {
  matcher: ["/admin/:path*"],
};
