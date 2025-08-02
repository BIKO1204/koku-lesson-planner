export async function updateUser(uid: string, disabled: boolean, role: string) {
  const res = await fetch("/api/admin/userList", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, disabled, role }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "更新失敗");
  }
}
