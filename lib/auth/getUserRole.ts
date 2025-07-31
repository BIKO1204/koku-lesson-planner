import { getAuth } from "firebase/auth";

export async function getUserRole() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return null;

  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.role || null;
}
