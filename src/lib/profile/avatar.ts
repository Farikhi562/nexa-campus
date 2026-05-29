export async function updateProfileAvatar(avatarUrl: string) {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatar_url: avatarUrl }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Gagal menyimpan foto profil");
  }

  return payload.profile as { id: string; avatar_url: string };
}
