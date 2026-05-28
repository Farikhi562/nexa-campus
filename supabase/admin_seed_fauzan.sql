-- Promote Fauzan to permanent admin/tier 3 and create the first room.
-- Run this in the Supabase SQL Editor after schema.sql has been applied.

do $$
declare
  v_user_id uuid;
  v_document_id uuid;
  v_room_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  where lower(email) = lower('fauzanalfa36@gmail.com')
  limit 1;

  if v_user_id is null then
    raise exception 'User fauzanalfa36@gmail.com belum ada di auth.users. Login/sign up dulu, lalu jalankan SQL ini lagi.';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    plan,
    profile_completed,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    'fauzanalfa36@gmail.com',
    'Fauzan Alfa',
    'admin',
    true,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    plan = 'admin',
    profile_completed = true,
    updated_at = now();

  select id
  into v_document_id
  from public.documents
  where user_id = v_user_id
    and status = 'completed'
  order by created_at desc
  limit 1;

  insert into public.study_rooms (
    creator_id,
    document_id,
    room_code,
    title,
    is_active,
    expires_at
  )
  values (
    v_user_id,
    v_document_id,
    'FAUZAN',
    'Fauzan Admin Study Room',
    true,
    now() + interval '10 years'
  )
  on conflict (room_code) do update
  set
    creator_id = excluded.creator_id,
    document_id = coalesce(excluded.document_id, public.study_rooms.document_id),
    title = excluded.title,
    is_active = true,
    expires_at = excluded.expires_at
  returning id into v_room_id;

  insert into public.room_participants (room_id, user_id)
  values (v_room_id, v_user_id)
  on conflict (room_id, user_id) do nothing;
end $$;
