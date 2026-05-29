import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasProAccess } from "@/lib/plans";
import type { Profile } from "@/types";

const allowedProfileFields = new Set([
  "avatar_url",
  "full_name",
  "telegram_chat_id",
]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!allowedProfileFields.has(key) || value === undefined) {
      continue;
    }

    if (value !== null && typeof value !== "string") {
      return NextResponse.json({ error: "Invalid profile field value" }, { status: 400 });
    }

    updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No supported profile fields provided" }, { status: 400 });
  }

  if (typeof updates.avatar_url === "string") {
    const avatarUrl = updates.avatar_url.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isAllowedAvatar =
      avatarUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/avatars/${user.id}/`) ||
      avatarUrl.startsWith("https://lh3.googleusercontent.com/");

    if (!isAllowedAvatar) {
      return NextResponse.json({ error: "URL avatar tidak valid." }, { status: 400 });
    }

    updates.avatar_url = avatarUrl;
  }

  if (typeof updates.telegram_chat_id === "string" && updates.telegram_chat_id.trim()) {
    const telegramChatId = updates.telegram_chat_id.trim();
    updates.telegram_chat_id = telegramChatId;
    if (!/^-?\d{5,20}$/.test(telegramChatId)) {
      return NextResponse.json({ error: "Telegram chat_id tidak valid." }, { status: 400 });
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("plan, seat_owner_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!hasProAccess(currentProfile as Pick<Profile, "plan" | "seat_owner_id"> | null)) {
      return NextResponse.json({ error: "Koneksi Telegram otomatis hanya tersedia untuk paket Pro." }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
