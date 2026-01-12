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

      // ① NextAuth側に role/admin が入っている
      const byRole = t.role === "admin" || t.admin === true;

      // ② もしくは allowlist に入っている（Firebase側と揃える）
      const byAllowlist = !!email && ADMIN_EMAILS.includes(email);

      return byRole || byAllowlist;
    },
  },
  pages: { signIn: "/welcome" },
});

export const config = {
  matcher: ["/admin/:path*"],
};
