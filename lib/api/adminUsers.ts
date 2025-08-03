import { getAuth } from "firebase/auth";

export async function updateUser(
  uid: string,
  disabled?: boolean,
  role?: string
) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("ログインしていません");
    const token = await user.getIdToken(true);

    const body: { uid: string; disabled?: boolean; role?: string } = { uid };
    if (typeof disabled === "boolean") body.disabled = disabled;
    if (typeof role === "string") body.role = role;

    const res = await fetch("/api/admin/userList", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失敗");
    }
  } catch (error: any) {
    throw new Error(error.message || "更新処理で予期しないエラーが発生しました");
  }
}
