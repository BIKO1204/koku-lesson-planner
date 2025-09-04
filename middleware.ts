import { withAuth } from "next-auth/middleware";

// JWT の token に role か admin:true が入っていれば許可
export default withAuth(
  {
    callbacks: {
      authorized: ({ token }) => {
        if (!token) return false;
        const isAdmin = (token as any).role === "admin" || (token as any).admin === true;
        return !!isAdmin;
      },
    },
    pages: { signIn: "/welcome" },
  }
);

export const config = {
  matcher: ["/admin/:path*"], // /admin 配下すべてに適用
};
