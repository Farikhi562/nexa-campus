# NEXA Campus — Setup Database (Supabase)

Ikuti langkah ini **sekali** untuk menghilangkan error
`Could not find the 'campus_name' column of 'profiles' in the schema cache`
dan mengaktifkan fitur profil, login user baru, dan referral.

## Cara tercepat (disarankan)

1. Buka **Supabase Dashboard → SQL Editor → New query**.
2. Buka file [`schema.sql`](./schema.sql), copy **seluruh** isinya, paste ke editor.
3. Klik **Run**. Tunggu sampai muncul **Success**.

`schema.sql` sudah lengkap dan **idempotent** (aman dijalankan berkali-kali) —
sudah mencakup semua migration. Tidak perlu menjalankan file lain.

> Kalau kamu cuma mau memperbaiki database yang sudah ada tanpa menyentuh tabel
> lain, jalankan saja `migrations/202606050001_fix_profile_schema_cache.sql`.

## Kenapa error "schema cache" bisa muncul

PostgREST (lapisan API Supabase) menyimpan cache struktur tabel. Kalau kolom
seperti `campus_name`, `province`, `gender`, atau `avatar_icon` belum ada —
atau sudah ditambah tetapi cache belum di-refresh — maka request akan gagal
dengan pesan tersebut. File SQL di atas:

- menambahkan semua kolom yang dibutuhkan (`add column if not exists`), dan
- menjalankan `notify pgrst, 'reload schema';` untuk me-refresh cache.

## Environment variables yang wajib diisi (Vercel / hosting kamu)

| Variable | Dipakai untuk |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Koneksi Supabase (client & server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Koneksi Supabase (client & server) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Wajib agar fitur referral memberi reward.** Tanpa ini, referral tetap tercatat di sesi tapi reward 30 hari Pulse tidak akan diproses. |

> `SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia. Simpan hanya sebagai server-side
> env (jangan diberi prefix `NEXT_PUBLIC_`).

## Cek cepat setelah setup

Jalankan query ini di SQL Editor — semua kolom harus muncul:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by column_name;
```

## Troubleshooting

### `check constraint "profiles_plan_check" ... is violated by some row`

Artinya ada baris lama di `profiles` yang nilai kolomnya di luar daftar yang
diizinkan (mis. `plan` bukan `radar/pulse/command`). Versi terbaru `schema.sql`
sudah otomatis merapikan data ini **sebelum** menambah constraint, jadi cukup
jalankan ulang `schema.sql`.

Sebelum menjalankan, kamu bisa mengintip dulu nilai yang bermasalah:

```sql
select id, email, plan from public.profiles
where plan is null or plan not in ('radar', 'pulse', 'command');
```

> Catatan: secara default, nilai `plan` yang tidak dikenal akan diubah menjadi
> `radar`. Kalau ada user lama yang seharusnya tetap berbayar (Pulse/Command),
> set manual dulu sebelum menjalankan schema, contoh:
>
> ```sql
> update public.profiles set plan = 'command' where email = 'user@contoh.com';
> ```

Hal yang sama berlaku untuk `semester`, `gender`, dan `reminder_preference` —
nilai di luar rentang yang valid akan dirapikan otomatis.

