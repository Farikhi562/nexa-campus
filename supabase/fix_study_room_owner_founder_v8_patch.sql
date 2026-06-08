-- NEXA Campus v1.5.23 patch: Study Room owner handoff + role sanity + founder verified cache reload.
-- Tidak menambah versi. Ini cuma memastikan constraint role aman di production.

alter table public.study_room_members
  drop constraint if exists study_room_members_role_check;

alter table public.study_room_members
  add constraint study_room_members_role_check
  check (role in ('owner', 'admin', 'moderator', 'member'));

-- Pastikan room bisa menyimpan owner baru saat owner lama keluar / transfer.
alter table public.study_rooms
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

create index if not exists study_room_members_room_role_idx
  on public.study_room_members(room_id, role);

notify pgrst, 'reload schema';
