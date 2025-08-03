import { getAuth } from "firebase/auth";

export async function getUserRole(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return null;

  try {
    const tokenResult = await user.getIdTokenResult();
    const roleClaim = tokenResult.claims.role;
    if (typeof roleClaim === "string") {
      return roleClaim;
    }
    return null;
  } catch (error) {
    console.error("トークン取得エラー:", error);
    return null;
  }
}
